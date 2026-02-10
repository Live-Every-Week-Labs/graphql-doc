import { DocModel, ExpandedType, Operation } from '../transformer/types.js';
import { buildOperationsByType, buildTypesByName } from '../utils/index.js';

export interface SerializedDocData {
  operationsByType: Record<Operation['operationType'], Record<string, Operation>>;
  typesByName: Record<string, ExpandedType>;
  operationsJson: string;
  typesJson: string;
}

export function serializeDocData(model: DocModel): SerializedDocData {
  const operationsByType = buildOperationsByType(model);
  const typesByName = buildTypesByName(model.types);

  return {
    operationsByType,
    typesByName,
    operationsJson: JSON.stringify(operationsByType, null, 2),
    typesJson: JSON.stringify(typesByName, null, 2),
  };
}
