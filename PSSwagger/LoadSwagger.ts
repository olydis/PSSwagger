// DUP: utilities
function removeSpecialCharacter(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

function getPascalCasedString(name: string): string {
  if (name) {
    name = removeSpecialCharacter(name);
    return name.charAt(0).toUpperCase() + name.substr(1);
  }
  return undefined;
}

const csharpReservedWords = [
  'abstract', 'as', 'async', 'await', 'base',
  'bool', 'break', 'byte', 'case', 'catch',
  'char', 'checked', 'class', 'const', 'continue',
  'decimal', 'default', 'delegate', 'do', 'double',
  'dynamic', 'else', 'enum', 'event', 'explicit',
  'extern', 'false', 'finally', 'fixed', 'float',
  'for', 'foreach', 'from', 'global', 'goto',
  'if', 'implicit', 'in', 'int', 'interface',
  'internal', 'is', 'lock', 'long', 'namespace',
  'new', 'null', 'object', 'operator', 'out',
  'override', 'params', 'private', 'protected', 'public',
  'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string',
  'struct', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'uint', 'ulong', 'unchecked',
  'unsafe', 'ushort', 'using', 'virtual', 'void',
  'volatile', 'while', 'yield', 'var'];
function getCSharpModelName(name: string): string {
  name = name.replace(/\[\]/g, 'Sequence');
  name = name.replace(/[^a-zA-Z0-9_-]/g, '');
  if (csharpReservedWords.includes(name.toLowerCase())) {
    name += "Model";
  }
  return getPascalCasedString(name);
}


function logWarning(message: string) { }

const psSwaggerDefaultNamespace = "Microsoft.PowerShell";

function resolveReferenceParameterType(referenceTypeName: string, definitionTypeNamePrefix: string, definitionFunctionDetails: any) {
  let ParameterType = definitionTypeNamePrefix + referenceTypeName;
  let ValidateSet = null;
  let ValidateSetString = null;

  // Some referenced definitions can be non-models like enums with validateset.
  if (definitionFunctionDetails[referenceTypeName] &&
    definitionFunctionDetails[referenceTypeName].Type &&
    !definitionFunctionDetails[referenceTypeName].IsModel) {
    ParameterType = definitionFunctionDetails[referenceTypeName].Type;

    if (definitionFunctionDetails[referenceTypeName].ValidateSet) {
      ValidateSet = definitionFunctionDetails[referenceTypeName].ValidateSet;
      ValidateSetString = `'${ValidateSet.join(', ')}'`;
    }
  }

  return {
    ParameterType: ParameterType,
    ValidateSet: ValidateSet,
    ValidateSetString: ValidateSetString
  };
}

function setTypeUsedAsClientFlatten(referenceTypeName: string, definitionFunctionsDetails: any) {
  const referencedFunctionDetails = definitionFunctionsDetails[referenceTypeName] || { Name: referenceTypeName };

  referencedFunctionDetails['IsUsedAs_x_ms_client_flatten'] = true;

  definitionFunctionsDetails[referenceTypeName] = referencedFunctionDetails;
}


function getPsTypeFromSwaggerObject(parameterType: string, jsonObject?: any): string {
  let parameterFormat: string = null;
  if (jsonObject) {
    if (jsonObject.type) parameterType = jsonObject.type;
    if (jsonObject.format) parameterFormat = jsonObject.format;
  }
  switch (parameterType.toLowerCase()) {
    case "boolean": return "switch";
    case "integer": return parameterFormat || "int64";
    case "number": return parameterFormat || "double";
  }
  return parameterType;
}

function getParamType(
  parameterJsonObject: any,
  modelsNamespace: string,
  parameterName: string,
  swaggerDict: any,
  definitionFunctionsDetails: any
) {
  let DefinitionTypeNamePrefix = modelsNamespace + ".";
  let paramType = "";
  let ValidateSetString = null;
  let isParameter = true;
  let GlobalParameterDetails = null;
  let ReferenceTypeName = null;
  if (parameterJsonObject.Type) {
    paramType = parameterJsonObject.Type;

    // Use the format as parameter type if that is available as a type in PowerShell
    if (parameterJsonObject.Format) {
      paramType = parameterJsonObject.Format;
    }
    else if (parameterJsonObject.Type === 'array' && parameterJsonObject.Items) {
      if (parameterJsonObject.Items['$ref']) {
        const ReferenceTypeValue = parameterJsonObject.Items['$ref'];
        ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
        const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
        paramType = ResolvedResult.ParameterType + '[]';
        if (ResolvedResult.ValidateSetString) {
          ValidateSetString = ResolvedResult.ValidateSetString;
        }
      }
      else if (parameterJsonObject.Items.Type) {
        ReferenceTypeName = getPsTypeFromSwaggerObject(parameterJsonObject.Items);
        paramType = ReferenceTypeName + "[]";
      }
    }
    else if (parameterJsonObject.AdditionalProperties) {
      // Dictionary
      if (parameterJsonObject.Type === 'object') {
        if (parameterJsonObject.AdditionalProperties.Type) {
          const AdditionalPropertiesType = getPsTypeFromSwaggerObject(parameterJsonObject.AdditionalProperties);
          paramType = `System.Collections.Generic.Dictionary[[${AdditionalPropertiesType}],[${AdditionalPropertiesType}]]`;
        }
        else if (parameterJsonObject.AdditionalProperties['$ref']) {
          const ReferenceTypeValue = parameterJsonObject.AdditionalProperties['$ref'];
          ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
          const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
          paramType = `System.Collections.Generic.Dictionary[[string],[${ResolvedResult.ParameterType}]]`;
        }
        else {
          logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);
        }
      }
      else if (parameterJsonObject.Type === 'string') {
        if (parameterJsonObject.AdditionalProperties.Type === 'array') {
          if (parameterJsonObject.AdditionalProperties.Items) {
            if (parameterJsonObject.AdditionalProperties.Items.Type) {
              const ItemsType = getPsTypeFromSwaggerObject(parameterJsonObject.AdditionalProperties.Items);
              paramType = `System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[${ItemsType}]]]`;
            }
            else if (parameterJsonObject.AdditionalProperties.Items['$ref']) {
              const ReferenceTypeValue = parameterJsonObject.AdditionalProperties.Items['$ref'];
              ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
              const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
              paramType = `System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[${ResolvedResult.ParameterType}]]]`;
            }
            else {
              logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);
            }
          }
          else {
            logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

          }
        }
        else {
          logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

        }
      }
      else {
        logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

      }
    }
  }
  else if (parameterName === 'Properties' &&
    parameterJsonObject['x-ms-client-flatten']) {
    // 'x-ms-client-flatten' extension allows to flatten deeply nested properties into the current definition.
    // Users often provide feedback that they don't want to create multiple levels of properties to be able to use an operation. 
    // By applying the x-ms-client-flatten extension, you move the inner properties to the top level of your definition.

    const ReferenceParameterValue = parameterJsonObject['$ref'];
    const x_ms_client_flatten_ReferenceTypeName = getCSharpModelName(ReferenceParameterValue.substr(ReferenceParameterValue.lastIndexOf('/') + 1));
    setTypeUsedAsClientFlatten(x_ms_client_flatten_ReferenceTypeName, definitionFunctionsDetails);
  }
  else if (parameterJsonObject['$ref']) {

    // Currently supported parameter references:
    //     #/parameters/<PARAMETERNAME> or #../../<Parameters>.Json/parameters/<PARAMETERNAME>
    //     #/definitions/<DEFINITIONNAME> or #../../<Definitions>.Json/definitions/<DEFINITIONNAME>
    const ReferenceParameterValue = parameterJsonObject['$ref'];
    const ReferenceParts = ReferenceParameterValue.split('/').map(x => x.trim());
    if (ReferenceParts.length >= 3) {
      if (ReferenceParts[ReferenceParts.length - 2] === 'Parameters') {
        //  #<...>/parameters/<PARAMETERNAME>
        const GlobalParameters = swaggerDict['Parameters'];
        // Cloning the common parameters object so that some values can be updated without impacting other operations.
        const GlobalParamDetails = JSON.parse(JSON.stringify(GlobalParameters[ReferenceParts[ReferenceParts.length - 1]]));

        // Get the definition name of the global parameter so that 'New-<DefinitionName>Object' can be generated.
        if (GlobalParamDetails.Type && GlobalParamDetails.Type.includes('.')) {
          ReferenceTypeName = GlobalParamDetails.Type.split('.').reverse()[0];
        }

        // Valid values for this extension are: "client", "method".
        GlobalParameterDetails = GlobalParamDetails;
        if (!(GlobalParamDetails && GlobalParamDetails.x_ms_parameter_location === 'method')) {
          isParameter = false;
        }
      }
      else if (ReferenceParts[ReferenceParts.length - 2] === 'Definitions') {
        //  #<...>/definitions/<DEFINITIONNAME>
        ReferenceTypeName = getCSharpModelName(ReferenceParts[ReferenceParts.length - 1]);
        const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
        paramType = ResolvedResult.ParameterType;
        if (ResolvedResult.ValidateSetString) {
          ValidateSetString = ResolvedResult.ValidateSetString;
        }
      }
    }
  }
  else if (parameterJsonObject.Schema && parameterJsonObject.Schema['$ref']) {
    const ReferenceParameterValue = parameterJsonObject.Schema['$ref'];
    const x_ms_client_flatten_ReferenceTypeName = getCSharpModelName(ReferenceParameterValue.substr(ReferenceParameterValue.lastIndexOf('/') + 1));
    const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
    paramType = ResolvedResult.ParameterType;
    if (ResolvedResult.ValidateSetString) {
      ValidateSetString = ResolvedResult.ValidateSetString;
    }

    if (parameterJsonObject['x-ms-client-flatten']) {
      setTypeUsedAsClientFlatten(ReferenceTypeName, definitionFunctionsDetails);
      // Assigning $null to $ReferenceTypeName so that this referenced definition is not set as UsedAsPathOperationInputType
      ReferenceTypeName = null;
    }
  }
  else {
    paramType = 'object';
  }

  paramType = getPsTypeFromSwaggerObject(paramType);
  if (parameterJsonObject.Enum) {
    // AutoRest doesn't generate a parameter on Async method for the path operation 
    // when a parameter is required and has singly enum value.
    // Also, no enum type gets generated by AutoRest.
    if ((parameterJsonObject.Enum.length === 1) &&
      parameterJsonObject.Required === true) {
      paramType = "";
    }
    else if (parameterJsonObject['x-ms-enum'] && parameterJsonObject['x-ms-enum'].modelAsString === false) {
      paramType = DefinitionTypeNamePrefix + getCSharpModelName(parameterJsonObject['x-ms-enum'].name);
    }
    else {
      const ValidateSet = parameterJsonObject.Enum.replace(x => x.replace(/'/g, "''"));
      ValidateSetString = `'${ValidateSet.join(', ')}'`;
    }
  }

  if (ReferenceTypeName) {
    if (definitionFunctionsDetails[ReferenceTypeName]) {
      definitionFunctionsDetails[ReferenceTypeName].UsedAsPathOperationInputType = true;
    }
  }

  return {
    ParamType: paramType,
    ValidateSetString: ValidateSetString,
    IsParameter: isParameter,
    GlobalParameterDetails: GlobalParameterDetails
  };
}

function getDefinitionParameterType(
  parameterJsonObject: any,
  definitionName: string,
  parameterName: string,
  definitionFunctionsDetails: any,
  modelsNamespace: string,
  parametersTable: any
) {
  let DefinitionTypeNamePrefix = modelsNamespace + ".";

  let paramType = null;
  let ValidateSet = null;
  let ReferenceTypeName = null;

  if (parameterJsonObject.Type) {
    paramType = parameterJsonObject.Type;

    // When a definition property has single enum value, AutoRest doesn't generate an enum type.
    if (parameterJsonObject.Enum && parameterJsonObject.Enum.length > 1) {
      if (parameterJsonObject['x-ms-enum'] && parameterJsonObject['x-ms-enum'].modelAsString === false) {
        paramType = DefinitionTypeNamePrefix + getCSharpModelName(parameterJsonObject['x-ms-enum'].name);
      }
      else {
        ValidateSet = parameterJsonObject.Enum.replace(x => x.replace(/'/g, "''"));
      }
    }
    // Use the format as parameter type if that is available as a type in PowerShell
    else if (parameterJsonObject.Format) {
      paramType = parameterJsonObject.Format;
    }
    else if (parameterJsonObject.Type === 'array' && parameterJsonObject.Items) {
      if (parameterJsonObject.Items['$ref']) {
        const ReferenceTypeValue = parameterJsonObject.Items['$ref'];
        ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
        const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
        paramType = ResolvedResult.ParameterType + '[]';
        if (ResolvedResult.ValidateSetString) {
          ValidateSet = ResolvedResult.ValidateSet;
        }
      }
      else if (parameterJsonObject.Items.Type) {
        ReferenceTypeName = getPsTypeFromSwaggerObject(parameterJsonObject.Items);
        paramType = ReferenceTypeName + "[]";
      }
    }
    else if (parameterJsonObject.AdditionalProperties) {
      if (parameterJsonObject.Type === 'object') {
        if (parameterJsonObject.AdditionalProperties.Type) {
          const AdditionalPropertiesType = getPsTypeFromSwaggerObject(parameterJsonObject.AdditionalProperties);
          paramType = `System.Collections.Generic.Dictionary[[${AdditionalPropertiesType}],[${AdditionalPropertiesType}]]`;
        }
        else if (parameterJsonObject.AdditionalProperties['$ref']) {
          const ReferenceTypeValue = parameterJsonObject.AdditionalProperties['$ref'];
          ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
          const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
          paramType = `System.Collections.Generic.Dictionary[[string],[${ResolvedResult.ParameterType}]]`;
        }
        else {
          logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);
        }
      }
      else if (parameterJsonObject.Type === 'string') {
        if (parameterJsonObject.AdditionalProperties.Type === 'array') {
          if (parameterJsonObject.AdditionalProperties.Items) {
            if (parameterJsonObject.AdditionalProperties.Items.Type) {
              const ItemsType = getPsTypeFromSwaggerObject(parameterJsonObject.AdditionalProperties.Items);
              paramType = `System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[${ItemsType}]]]`;
            }
            else if (parameterJsonObject.AdditionalProperties.Items['$ref']) {
              const ReferenceTypeValue = parameterJsonObject.AdditionalProperties.Items['$ref'];
              ReferenceTypeName = getCSharpModelName(ReferenceTypeValue.substr(ReferenceTypeValue.lastIndexOf('/') + 1));
              const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
              paramType = `System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[${ResolvedResult.ParameterType}]]]`;
            }
            else {
              logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);
            }
          }
          else {
            logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

          }
        }
        else {
          logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

        }
      }
      else {
        logWarning(`'ParameterJsonObject' has unsupported properties. ${parameterJsonObject}`);

      }
    }
  }
  else if (parameterName === 'Properties' &&
    parameterJsonObject['x-ms-client-flatten']) {
    // 'x-ms-client-flatten' extension allows to flatten deeply nested properties into the current definition.
    // Users often provide feedback that they don't want to create multiple levels of properties to be able to use an operation. 
    // By applying the x-ms-client-flatten extension, you move the inner properties to the top level of your definition.

    const ReferenceParameterValue = parameterJsonObject['$ref'];
    const x_ms_client_flatten_ReferenceTypeName = getCSharpModelName(ReferenceParameterValue.substr(ReferenceParameterValue.lastIndexOf('/') + 1));
    setTypeUsedAsClientFlatten(x_ms_client_flatten_ReferenceTypeName, definitionFunctionsDetails);

    const x_ms_Client_flatten_DefinitionNames = [x_ms_client_flatten_ReferenceTypeName];

    // Add/Update FunctionDetails to $DefinitionFunctionsDetails
    let FunctionDetails = {};
    if (definitionFunctionsDetails[definitionName]) {
      FunctionDetails = definitionFunctionsDetails[definitionName];
      FunctionDetails['x_ms_Client_flatten_DefinitionNames'].push(...x_ms_Client_flatten_DefinitionNames);
    }
    else {
      FunctionDetails['Name'] = definitionName;
      FunctionDetails['x_ms_Client_flatten_DefinitionNames'] = x_ms_Client_flatten_DefinitionNames;
    }
    definitionFunctionsDetails[definitionName] = FunctionDetails;
  }
  else if (parameterJsonObject['$ref']) {
    const ReferenceParameterValue = parameterJsonObject['$ref'];
    const ReferenceParts = ReferenceParameterValue.split('/').map(x => x.trim());
    ReferenceTypeName = getCSharpModelName(ReferenceParts[ReferenceParts.length - 1]);
    const ResolvedResult = resolveReferenceParameterType(ReferenceTypeName, DefinitionTypeNamePrefix, definitionFunctionsDetails);
    paramType = ResolvedResult.ParameterType;
    if (ResolvedResult.ValidateSetString) {
      ValidateSet = ResolvedResult.ValidateSet;
    }
  }
  else {
    paramType = 'object';
  }

  paramType = getPsTypeFromSwaggerObject(paramType);

  return {
    ParameterType: paramType,
    ValidateSet: ValidateSet
  };
}

function getParameterGroupName(rawName?: string, operationId?: string, postfix: string = "Parameters"): string {

  if (rawName) {
    // AutoRest only capitalizes the first letter and the first letter after a hyphen
    let newName = '';
    let capitalize = true;
    for (let i = 0; i < rawName.length; ++i) {
      const ch = rawName.charAt(i);
      let chc = rawName.charCodeAt(i);
      if ('-' === ch) {
        capitalize = true;
      } else if (capitalize) {
        capitalize = false;
        if ((97 <= chc) && (122 >= chc)) {
          chc -= 32;
        }

        newName += String.fromCharCode(chc);
      } else {
        newName += ch;
      }
    }

    return removeSpecialCharacter(newName);
  } else {
    const split = operationId.split('_');
    if (split.length === 2) {
      return `${split[0]}${split[1]}${postfix}`;
    } else {
      // Don't ask
      return `HyphenMinus${operationId}HyphenMinus${postfix}`;
    }
  }
}


function getSwaggerParameters(parameters: any, info: any, definitionFunctionsDetails: any, swaggerParameters: any, azureSpec: boolean, psMetaParametersJsonObject: any) {
  for (const parameter in parameters) {
    const GlobalParameterName = parameter
    const GPJsonValueObject = parameters[parameter];

    if (swaggerParameters[GlobalParameterName]) {
      continue;
    }

    let IsParamMandatory = '$false';
    let ParameterDescription = '';
    let x_ms_parameter_location = 'client';
    let x_ms_parameter_grouping = '';
    let ConstantValue = '';
    let ReadOnlyGlobalParameter = false;
    let parameterName = "";
    if (GPJsonValueObject['x-ms-client-name']) {
      parameterName = getPascalCasedString(GPJsonValueObject['x-ms-client-name']);
    } else if (GPJsonValueObject.Name) {
      parameterName = getPascalCasedString(GPJsonValueObject.Name);
    }

    if (GPJsonValueObject['x-ms-parameter-location']) {
      x_ms_parameter_location = GPJsonValueObject['x-ms-parameter-location'];
    }

    if (azureSpec) {
      // Some global parameters have constant values not expressed in the Swagger spec when dealing with Azure
      if ('subscriptionid' === parameterName.toLowerCase()) {
        // See PSSwagger.Constants.ps1 $functionBodyStr for this variable name
        ConstantValue = '`$subscriptionId';
      } else if ('apiversion' === parameterName.toLowerCase()) {
        ReadOnlyGlobalParameter = true;
      }
    }

    if (GPJsonValueObject.Required) {
      IsParamMandatory = '$true';
    }

    if (GPJsonValueObject.Description) {
      ParameterDescription = GPJsonValueObject.Description;
    }

    const paramTypeObject = getParamType(GPJsonValueObject, `${info.NameSpace}.${info.Models}`, parameterName, /*huh?*/undefined, definitionFunctionsDetails);

    if (GPJsonValueObject['x-ms-parameter-grouping']) {
      const groupObject = GPJsonValueObject['x-ms-parameter-grouping'];
      let parsedName: string;
      if (groupObject.name) {
        parsedName = getParameterGroupName(groupObject.name);
      } else if (groupObject.postfix) {
        parsedName = getParameterGroupName(undefined, /*OperationId*/ undefined, groupObject.postfix);
      } else {
        parsedName = getParameterGroupName(undefined, /*OperationId*/ undefined);
      }

      x_ms_parameter_grouping = parsedName;
    }

    let FlattenOnPSCmdlet = !!(psMetaParametersJsonObject && psMetaParametersJsonObject[GlobalParameterName] && psMetaParametersJsonObject[GlobalParameterName]["x-ps-parameter-info"] && psMetaParametersJsonObject[GlobalParameterName]["x-ps-parameter-info"]["flatten"]);


    swaggerParameters[GlobalParameterName] = {
      Name: parameterName,
      Type: paramTypeObject.ParamType,
      ValidateSet: paramTypeObject.ValidateSetString,
      Mandatory: IsParamMandatory,
      Description: ParameterDescription,
      IsParameter: paramTypeObject.IsParameter,
      x_ms_parameter_location: x_ms_parameter_location,
      x_ms_parameter_grouping: x_ms_parameter_grouping,
      ConstantValue: ConstantValue,
      ReadOnlyGlobalParameter: ReadOnlyGlobalParameter,
      FlattenOnPSCmdlet: FlattenOnPSCmdlet
    };
  }
}


function getSwaggerInfo(info: any, moduleName: string, moduleVersion: string, clientTypeName: string, modelsName: string) {
  moduleVersion = moduleVersion || "0.0.1";
  modelsName = modelsName || "Models";
  const infoVersion = info.version || '1-0-0';
  const infoTitle = info.title;
  let CodeOutputDirectory = '';
  let codeGenFileRequired = false;
  let Header = '';
  let infoName = infoTitle.replace(/[^a-zA-Z0-9_]/g, '');

  let Description = info.description || '';

  let ProjectUri = info.contact && info.contact.url || '';
  let ContactEmail = info.contact && info.contact.email || '';
  let ContactName = info.contact && info.contact.name || '';

  let LicenseUri = info.license && info.license.url || '';
  let LicenseName = info.license && info.license.name || '';

  // Using the info name as module name when $ModuleName is not specified.
  // This is required for PSMeta generaration.
  moduleName = moduleName || infoName;

  // Default namespace supports sxs
  const NamespaceVersionSuffix = "v" + moduleVersion.replace(/\./g, '');
  let NameSpace = `${psSwaggerDefaultNamespace}.${moduleName}.${NamespaceVersionSuffix}`;

  if (clientTypeName) {
    // Get the namespace from namespace qualified client type name.
    const LastDotIndex = clientTypeName.lastIndexOf('.');
    if (LastDotIndex !== -1) {
      NameSpace = clientTypeName.substr(0, LastDotIndex);
      clientTypeName = clientTypeName.substr(LastDotIndex + 1)
    }
  }
  else {
    // AutoRest generates client name with 'Client' appended to info title when a NameSpace part is same as the info name.
    if (NameSpace.split('.').includes(infoName)) {
      clientTypeName = infoName + 'Client';
    }
    else {
      clientTypeName = infoName;
    }
  }

  return {
    InfoVersion: infoVersion,
    InfoTitle: infoTitle,
    InfoName: infoName,
    ClientTypeName: clientTypeName,
    Version: moduleVersion,
    NameSpace: NameSpace,
    ModuleName: moduleName,
    Description: Description,
    ContactName: ContactName,
    ContactEmail: ContactEmail,
    ProjectUri: ProjectUri,
    LicenseUri: LicenseUri,
    LicenseName: LicenseName,
    CodeOutputDirectory: CodeOutputDirectory,
    CodeGenFileRequired: codeGenFileRequired,
    Models: modelsName,
    Header: Header
  };
}


function convertToSwaggerDictionary(
  swaggerSpecPath: string,
  swaggerSpecFilePaths: string[],
  definitionFunctionsDetails: any,
  moduleName: string,
  moduleVersion: string = "0.0.1",
  clientTypeName: string,
  modelsName: string,
  defaultCommandPrefix: string,
  header: string,
  azureSpec: boolean,
  disableVersionSuffix: boolean,
  psCodeGen: any,
  psMetaJsonObject: any
) {
  const swaggerDocObject = require(swaggerSpecPath);
  const swaggerDict: any = {};

  if (!('info' in swaggerDocObject)) {
    throw "Invalid Swagger specification file. Info section doesn't exists.";
  }

  if (psCodeGen && ('securityDefinitions' in swaggerDocObject)) {
    swaggerDict['SecurityDefinitions'] = swaggerDocObject.securityDefinitions;
    if ('azure_auth' in swaggerDocObject) {
      psCodeGen['ServiceType'] = 'azure';
    }
  }

  if ('security' in swaggerDocObject) {
    swaggerDict['Security'] = swaggerDocObject.security;
  }

  swaggerDict['Info'] = getSwaggerInfo(swaggerDocObject.info, moduleName, moduleVersion, clientTypeName, modelsName);
  swaggerDict['Info']['DefaultCommandPrefix'] = defaultCommandPrefix;
  if (header) {
    swaggerDict['Info']['Header'] = header;
  }

  if (swaggerDocObject.info['x-ps-module-info'] && 'commandDefaults' in swaggerDocObject.info['x-ps-module-info']) {
    swaggerDict['CommandDefaults'] = Object.assign({}, swaggerDocObject.info['x-ps-module-info'].commandDefaults);
  } else if (psMetaJsonObject && psMetaJsonObject.info && psMetaJsonObject.info['x-ps-module-info'] && psMetaJsonObject.info['x-ps-module-info'].commandDefaults) {
    swaggerDict['CommandDefaults'] = {};
    for (const property in psMetaJsonObject.info['x-ps-module-info'] && psMetaJsonObject.info['x-ps-module-info'].commandDefaults) {
      swaggerDict['CommandDefaults'][property] = psMetaJsonObject.info['x-ps-module-info'].commandDefaults[property];
    }
  }

  const SwaggerParameters = {};
  let SwaggerDefinitions = {};
  let SwaggerPaths = {};

  const psMetaParametersJsonObject = psMetaJsonObject && psMetaJsonObject.parameters || null;
  for (const FilePath of swaggerSpecFilePaths) {
    const swaggerObject = require(FilePath);
    if (swaggerObject.parameters) {
      getSwaggerParameters(swaggerObject.parameters, swaggerDict.Info, definitionFunctionsDetails, SwaggerParameters, azureSpec, psMetaParametersJsonObject);
    }

    if (swaggerObject.definitions) {
      for (const name in swaggerObject.definitions) {
        const modelName = getCSharpModelName(name);
        SwaggerDefinitions[modelName] = SwaggerDefinitions[modelName] || swaggerObject.definitions[name];
      }
    }

    SwaggerPaths = Object.assign({}, swaggerObject.paths, SwaggerPaths);
  }

  swaggerDict['Parameters'] = SwaggerParameters;
  swaggerDict['Definitions'] = SwaggerDefinitions;
  swaggerDict['Paths'] = SwaggerPaths;

  return swaggerDict;
}
