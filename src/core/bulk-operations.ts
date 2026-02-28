import type { ShopifyClient } from './shopify-client.js';
import type { Logger } from './logger.js';

interface StagedUploadTarget {
  url: string;
  resourceUrl: string;
  parameters: { name: string; value: string }[];
}

interface BulkOperationStatus {
  id: string;
  status: string;
  errorCode?: string;
  objectCount?: string;
  url?: string;
}

const STAGED_UPLOADS_CREATE = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const BULK_MUTATION_RUN = `
  mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
    bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const BULK_OPERATION_POLL = `
  query {
    currentBulkOperation(type: MUTATION) {
      id
      status
      errorCode
      objectCount
      url
    }
  }
`;

export async function runBulkMutation(
  client: ShopifyClient,
  logger: Logger,
  mutation: string,
  jsonlLines: string[],
): Promise<BulkOperationStatus> {
  // 1. Create staged upload
  logger.info('Création de l\'upload staged...');
  const stagedResult = await client.query<{
    stagedUploadsCreate: {
      stagedTargets: StagedUploadTarget[];
      userErrors: { field: string; message: string }[];
    };
  }>(STAGED_UPLOADS_CREATE, {
    input: [
      {
        resource: 'BULK_MUTATION_VARIABLES',
        filename: 'bulk-input.jsonl',
        mimeType: 'text/jsonl',
        httpMethod: 'POST',
      },
    ],
  });

  const errors = stagedResult.stagedUploadsCreate.userErrors;
  if (errors.length > 0) {
    throw new Error(`Staged upload error: ${errors.map((e) => e.message).join(', ')}`);
  }

  const target = stagedResult.stagedUploadsCreate.stagedTargets[0];

  // 2. Upload JSONL file
  logger.info(`Upload de ${jsonlLines.length} lignes JSONL...`);
  const formData = new FormData();
  for (const param of target.parameters) {
    formData.append(param.name, param.value);
  }
  formData.append('file', new Blob([jsonlLines.join('\n')], { type: 'text/jsonl' }));

  const uploadResponse = await fetch(target.url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  // 3. Run bulk mutation
  logger.info('Lancement de la bulk operation...');
  const bulkResult = await client.query<{
    bulkOperationRunMutation: {
      bulkOperation: { id: string; status: string };
      userErrors: { field: string; message: string }[];
    };
  }>(BULK_MUTATION_RUN, {
    mutation,
    stagedUploadPath: target.resourceUrl,
  });

  const bulkErrors = bulkResult.bulkOperationRunMutation.userErrors;
  if (bulkErrors.length > 0) {
    throw new Error(`Bulk operation error: ${bulkErrors.map((e) => e.message).join(', ')}`);
  }

  // 4. Poll until complete
  logger.info('En attente de la fin de la bulk operation...');
  return pollBulkOperation(client, logger);
}

async function pollBulkOperation(
  client: ShopifyClient,
  logger: Logger,
): Promise<BulkOperationStatus> {
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLLS = 2000; // ~100 minutes max

  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const result = await client.query<{
      currentBulkOperation: BulkOperationStatus | null;
    }>(BULK_OPERATION_POLL);

    const op = result.currentBulkOperation;
    if (!op) {
      throw new Error('Aucune bulk operation en cours trouvée');
    }

    logger.debug(`Bulk operation ${op.id}: ${op.status} (${op.objectCount || 0} objets)`);

    if (op.status === 'COMPLETED') {
      logger.info(`Bulk operation terminée: ${op.objectCount} objets traités`);
      return op;
    }

    if (op.status === 'FAILED') {
      throw new Error(`Bulk operation échouée: ${op.errorCode}`);
    }

    if (op.status === 'CANCELED') {
      throw new Error('Bulk operation annulée');
    }
  }

  throw new Error('Timeout: bulk operation trop longue');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
