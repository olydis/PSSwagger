function logVerbose(message: string) { }
function logDebug(message: string) { }
function logWarning(message: string) { }

// DUP: Utilities.ts
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

// pluralization
import { EnglishPluralizationService } from "C:/work/english-pluralization-service";

function getPluralizationService(): EnglishPluralizationService {
  const result = new EnglishPluralizationService();
  const customMappings = [
    {
      "Database": "Databases"
    },
    {
      "database": "databases"
    }
  ];
  for (const mapping of customMappings)
    for (const key in mapping)
      result.AddWord(key, mapping[key]);
  return result;
}

function singularize(word: string): string {
  return getPluralizationService().Singularize(word);
}

function getSingularizedValue(name: string): string {
  return getPascalCasedString(singularize(name));
}

// verb stuff

const cmdVerbMap_GetVerb: { [verb: string]: string | string[] } = {
  "Add": "Common",
  "Clear": "Common",
  "Close": "Common",
  "Copy": "Common",
  "Enter": "Common",
  "Exit": "Common",
  "Find": "Common",
  "Format": "Common",
  "Get": "Common",
  "Hide": "Common",
  "Join": "Common",
  "Lock": "Common",
  "Move": "Common",
  "New": "Common",
  "Open": "Common",
  "Optimize": "Common",
  "Pop": "Common",
  "Push": "Common",
  "Redo": "Common",
  "Remove": "Common",
  "Rename": "Common",
  "Reset": "Common",
  "Resize": "Common",
  "Search": "Common",
  "Select": "Common",
  "Set": "Common",
  "Show": "Common",
  "Skip": "Common",
  "Split": "Common",
  "Step": "Common",
  "Switch": "Common",
  "Undo": "Common",
  "Unlock": "Common",
  "Watch": "Common",
  "Backup": "Data",
  "Checkpoint": "Data",
  "Compare": "Data",
  "Compress": "Data",
  "Convert": "Data",
  "ConvertFrom": "Data",
  "ConvertTo": "Data",
  "Dismount": "Data",
  "Edit": "Data",
  "Expand": "Data",
  "Export": "Data",
  "Group": "Data",
  "Import": "Data",
  "Initialize": "Data",
  "Limit": "Data",
  "Merge": "Data",
  "Mount": "Data",
  "Out": "Data",
  "Publish": "Data",
  "Restore": "Data",
  "Save": "Data",
  "Sync": "Data",
  "Unpublish": "Data",
  "Update": "Data",
  "Approve": "Lifecycle",
  "Assert": "Lifecycle",
  "Complete": "Lifecycle",
  "Confirm": "Lifecycle",
  "Deny": "Lifecycle",
  "Disable": "Lifecycle",
  "Enable": "Lifecycle",
  "Install": "Lifecycle",
  "Invoke": "Lifecycle",
  "Register": "Lifecycle",
  "Request": "Lifecycle",
  "Restart": "Lifecycle",
  "Resume": "Lifecycle",
  "Start": "Lifecycle",
  "Stop": "Lifecycle",
  "Submit": "Lifecycle",
  "Suspend": "Lifecycle",
  "Uninstall": "Lifecycle",
  "Unregister": "Lifecycle",
  "Wait": "Lifecycle",
  "Debug": "Diagnostic",
  "Measure": "Diagnostic",
  "Ping": "Diagnostic",
  "Repair": "Diagnostic",
  "Resolve": "Diagnostic",
  "Test": "Diagnostic",
  "Trace": "Diagnostic",
  "Connect": "Communications",
  "Disconnect": "Communications",
  "Read": "Communications",
  "Receive": "Communications",
  "Send": "Communications",
  "Write": "Communications",
  "Block": "Security",
  "Grant": "Security",
  "Protect": "Security",
  "Revoke": "Security",
  "Unblock": "Security",
  "Unprotect": "Security",
  "Use": "Other",
};

const cmdVerbMap_Custom: { [verb: string]: string | string[] } = {
  "Access": "Get",
  "List": "Get",
  "Cat": "Get",
  "Type": "Get",
  "Dir": "Get",
  "Obtain": "Get",
  "Dump": "Get",
  "Acquire": "Get",
  "Examine": "Get",
  "Suggest": "Get",
  "Retrieve": "Get",
  "Create": "New",
  "Generate": "New",
  "Allocate": "New",
  "Provision": "New",
  "Make": "New",
  "Regenerate": "New", // Alternatives: Redo, Update, Reset
  "CreateOrUpdate": ["New", "Set"],
  "Failover": "Set",
  "Assign": "Set",
  "Configure": "Set",
  "Activate": "Initialize",
  "Build": "Build",
  "Compile": "Build",
  "Deploy": "Deploy",
  "Apply": "Add",
  "Append": "Add",
  "Attach": "Add",
  "Concatenate": "Add",
  "Insert": "Add",
  "Delete": "Remove",
  "Cut": "Remove",
  "Dispose": "Remove",
  "Discard": "Remove",
  "Generalize": "Reset",
  "Patch": "Update",
  "Refresh": "Update",
  "Reprocess": "Update", // Alternatives: Redo
  "Upgrade": "Update",
  "Reimage": "Update", // Alternatives: Format, Reset
  "Retarget": "Update",
  "Validate": "Test",
  "Check": "Test",
  "Verify": "Test",
  "Analyze": "Test",
  "Is": "Test",
  "Evaluate": "Test", // Alternatives: Invoke
  "Power": "Start",
  "PowerOn": "Start",
  "Run": "Start", // Alternatives: Invoke
  "Trigger": "Start",
  "Pause": "Suspend",
  "Cancel": "Stop",
  "PowerOff": "Stop",
  "End": "Stop",
  "Shutdown": "Stop",
  "Reboot": "Restart",
  "ForceReboot": "Restart",
  "Finish": "Complete",
  "Wipe": "Clear",
  "Purge": "Clear", // Alternatives: Remove
  "Flush": "Clear",
  "Erase": "Clear",
  "Unmark": "Clear",
  "Unset": "Clear",
  "Nullify": "Clear",
  "Recover": "Restore",
  "Undelete": "Restore",
  "Synchronize": "Sync",
  "Synch": "Sync",
  "Load": "Import",
  "Capture": "Export", // Alternatives: Trace
  "Migrate": "Move", // Alternatives: Export
  "Transfer": "Move",
  "Name": "Move",
  "Reassociate": "Move",
  "Change": "Rename",
  "Swap": "Switch", // Alternatives: Move
  "Execute": "Invoke",
  "Perform": "Invoke",
  "Discover": "Find", // Alternatives: Search
  "Locate": "Find",
  "Release": "Publish", // Alternatives: Clear, Unlock
  "Resubmit": "Submit",
  "Duplicate": "Copy",
  "Clone": "Copy",
  "Replicate": "Copy",
  "Into": "Enter",
  "Combine": "Join",
  "Unite": "Join",
  "Associate": "Join",
  "Restrict": "Lock",
  "Secure": "Lock",
  "Unrestrict": "Unlock",
  "Unsecure": "Unlock",
  "Display": "Show",
  "Produce": "Show",
  "Bypass": "Skip",
  "Jump": "Skip",
  "Separate": "Split",
  "Notify": "Send",
  "Authorize": "Grant"
};

const cmdVerbMap = Object.assign({}, cmdVerbMap_GetVerb, cmdVerbMap_Custom);

function MapVerb(verb: string): string[] {
  verb = verb.toLowerCase();
  const keyHits = Object.keys(cmdVerbMap).filter(key => key.toLowerCase() === verb);
  if (keyHits.length == 0) return [];
  let value = cmdVerbMap[keyHits[0]];
  if (!Array.isArray(value)) value = [value];
  return value;
}

function ExistsVerb(verb: string) {
  return MapVerb(verb).length > 0;
}


// 

function getPathCommandName(operationId: string): any {
  const opIdValues = operationId.split("_", 2);

  // OperationId can be specified without '_' (Underscore), Verb will retrieved by the below logic for non-approved verbs.
  let cmdNoun = opIdValues.length === 2 ? getSingularizedValue(opIdValues[0]) : "";
  let cmdVerb = opIdValues.length === 2 ? opIdValues[1] : getSingularizedValue(operationId);
  let cmdVerbs: string[] = [cmdVerb];

  if (!Object
    .keys(cmdVerbMap_GetVerb)
    .map(v => v.toLowerCase())
    .includes(cmdVerb.toLowerCase())) {
    const unapprovedVerb = cmdVerb;
    logVerbose(`Verb '${unapprovedVerb}' not an approved verb.`);

    if (Object
      .keys(cmdVerbMap_Custom)
      .map(v => v.toLowerCase())
      .includes(cmdVerb.toLowerCase())) {
      // This condition happens when there aren't any suffixes
      cmdVerbs = MapVerb(cmdVerb);
      for (const v of cmdVerbs)
        logVerbose(`Using Verb '${v}' in place of '${unapprovedVerb}'.`);
    }
    else {
      // This condition happens in cases like: CreateSuffix, CreateOrUpdateSuffix
      let longestVerbMatch: string | null = null;
      let currentVerbCandidate: string = "";
      let firstWord = "";
      let firstWordStarted = false;
      let buildFirstWord = false;
      let firstWordEnd = -1;
      let verbMatchEnd = -1;
      for (let i = 0; i < unapprovedVerb.length; ++i) {
        // Add the start condition of the first word so that the end condition is easier
        if (!firstWordStarted) {
          firstWordStarted = true;
          buildFirstWord = true;
        } else if (buildFirstWord && (unapprovedVerb.charCodeAt(i) >= 65) && (unapprovedVerb.charCodeAt(i) <= 90)) {
          // Stop building the first word when we encounter another capital letter
          buildFirstWord = false;
          firstWordEnd = i;
        }

        if (buildFirstWord) {
          firstWord += unapprovedVerb.charAt(i);
        }

        currentVerbCandidate += unapprovedVerb.charAt(i);
        if (ExistsVerb(currentVerbCandidate)) {
          // The latest verb match is also the longest verb match
          longestVerbMatch = currentVerbCandidate;
          verbMatchEnd = i + 1;
        }
      }

      const beginningOfSuffix = longestVerbMatch ? verbMatchEnd : firstWordEnd;
      cmdVerb = longestVerbMatch ? longestVerbMatch : firstWord;

      if (Object
        .keys(cmdVerbMap_Custom)
        .map(v => v.toLowerCase())
        .includes(cmdVerb.toLowerCase())) {
        cmdVerbs = MapVerb(cmdVerb);
      } else {
        cmdVerbs = [cmdVerb];
      }
      console.log(cmdVerbs);

      if (-1 !== beginningOfSuffix) {
        // This is still empty when a verb match is found that is the entire string, but it might not be worth checking for that case and skipping the below operation
        const cmdNounSuffix = unapprovedVerb.substring(beginningOfSuffix);
        // Add command noun suffix only when the current noun doesn't contain it or vice-versa. 
        if (!cmdNoun) {
          cmdNoun = getPascalCasedString(cmdNounSuffix);
        }
        else if (!cmdNounSuffix.toLowerCase().startsWith('by')) {
          if (
            !cmdNoun.toLowerCase().includes(cmdNounSuffix.toLowerCase()) &&
            !cmdNounSuffix.toLowerCase().includes(cmdNoun.toLowerCase())) {
            cmdNoun += getPascalCasedString(cmdNounSuffix);
          }
          else if (cmdNounSuffix.toLowerCase().includes(cmdNoun.toLowerCase())) {
            cmdNoun = cmdNounSuffix;
          }
        }
      }
    }
  }

  // Singularize command noun
  if (cmdNoun) {
    cmdNoun = getSingularizedValue(cmdNoun);
  }

  const cmdletInfos = cmdVerbs.map(v => {
    const verb = getPascalCasedString(v);
    const commandName = cmdNoun ? `${verb}-${cmdNoun}` : getSingularizedValue(verb);
    logVerbose(`Using cmdlet name '${commandName}' for Swagger path operationid '${operationId}'.`);
    return { name: commandName };
  });
  return cmdletInfos;
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

function getOutputType(schema: any, modelsNamespace: string, definitionList: any): { outputType: string | null, outputTypeBlock: string | null } {
  let outputTypeBlock: any = null;
  let outputType: any = null;

  if (schema['$ref']) {
    const ref = schema['$ref'];
    const refParts = ref.split('/');
    if (refParts.length >= 3 && refParts[refParts.length - 2] == "definitions") {
      const key = getCSharpModelName(refParts[refParts.length - 1]);
      if (key in definitionList) {
        const definition = definitionList[key];
        const defProperties = definition.properties;
        let fullPathDataType: string | null = null;

        if (defProperties) {
          // If this data type is actually a collection of another $ref
          const defValue = defProperties.value;
          if (defValue) {
            let outputValueType = "";

            // Iff the value has items with $ref nested properties,
            // this is a collection and hence we need to find the type of collection
            const defRef = defValue.items && defValue.items["$ref"];
            if (defRef) {
              const defRefParts = ref.split('/');
              if (defRefParts.length >= 3 && defRefParts[defRefParts.length - 2] == "definitions") {
                let referenceTypeName = getCSharpModelName(defRefParts[defRefParts.length - 1]);
                fullPathDataType = `${modelsNamespace}.${referenceTypeName}`;
              }
              const defType = defValue.type;
              if (defType) {
                if (defType === "array") outputValueType = "[]";
                else throw new Error(`Please get an implementation of '${defType}' for '${ref}'`);
              }

              if (outputValueType && fullPathDataType) {
                fullPathDataType += " " + outputValueType;
              }
            }
          }
          if (fullPathDataType === null) {
            // if this datatype is not a collection of another $ref
            fullPathDataType = `${modelsNamespace}.${key}`;
          }
        }

        if (fullPathDataType) {
          fullPathDataType = fullPathDataType.replace(/\[|\]/g, '').trim();
          outputType = fullPathDataType;
          outputTypeBlock = outputTypeStr(fullPathDataType);
        }
      }
    }
  }

  return { outputType, outputTypeBlock };
}


function getAzureResourceIdParameters(
  jsonPathItemObject: any,
  resourceId: string,
  namespace: string,
  models: string,
  definitionList: any
): any {
  const getPathItemObject = jsonPathItemObject[Object.keys(jsonPathItemObject).filter(x => x.toLowerCase() === "get")[0]];
  if (!getPathItemObject) {
    logDebug(`Get operation not available in ${resourceId}.`);
    return;
  }

  const tokens = resourceId.split('/').filter(x => x !== "");
  if (tokens.length < 8) {
    logDebug(`The specified endpoint '${resourceId}' is not a valid resource identifier.`);
    return;
  }
  const resourceIdParameters = tokens
    .filter(t => t.startsWith('{') && t.endsWith('}'))
    .map(t => t.slice(1, -1))
    .filter(t => t.toLowerCase() !== "subscriptionid");
  if (tokens[tokens.length - 1] !== `{${resourceIdParameters[resourceIdParameters.length - 1]}}`) {
    return;
  }

  const responses = getPathItemObject.responses;
  if (!responses) {
    return;
  }
  const responseResult = getResponse(responses, namespace, models, definitionList);
  const getOperationOutputType = responseResult.OutputType;
  const modelsNamespace = `${namespace}.${models}`;
  if (!getOperationOutputType || !getOperationOutputType.toLowerCase().startsWith(modelsNamespace.toLowerCase())) {
    return;
  }

  return {
    resourceIdParameters,
    resourceName: resourceIdParameters[resourceIdParameters.length - 1],
    inputObjectParameterType: getOperationOutputType
  };
}

function getResponse(responses: any, namespace: string, models: string, definitionList: any): any {
  let outputTypeFlag = false;
  let outputType: any = null;
  let outputTypeBlock: any = null;
  let failWithDesc = "";

  for (const key of Object.keys(responses).map(x => +x).filter(x => !isNaN(x))) {
    const responseStatusValue = `'${key}'`;
    const value = responses[key];

    // handle success
    if (200 <= key && key < 300) {
      if (!outputTypeFlag && value.schema) {
        // Add the [OutputType] for the function
        const outputTypeResult = getOutputType(value.schema, `${namespace}.${models}`, definitionList);
        outputTypeBlock = outputTypeResult.outputTypeBlock;
        outputType = outputTypeResult.outputType;
        outputTypeFlag = true;
      }
    }

    // Handle Client Error
    if (400 <= key && key < 500) {
      if (value.description) {
        failWithDesc += failCase(responseStatusValue, "Write-Error 'CLIENT ERROR: " + value.description + "'");
      }
    }

    // Handle Server Error
    if (500 <= key && key < 600) {
      if (value.description) {
        failWithDesc += failCase(responseStatusValue, "Write-Error 'SERVER ERROR: " + value.description + "'");
      }
    }
  }

  return {
    responseBody: responseBodySwitchCase(failWithDesc),
    outputType,
    outputTypeBlock
  };
}



function getPathFunctionBody(
  parameterSetDetails: any,
  oDataExpressionBlock: string,
  parameterGroupsExpressionBlock: string,
  globalParameters: string[],
  swaggerDictInfo: any,
  swaggerDictDefinitions: any,
  useAzureCsharpGenerator: boolean,
  addHttpClientHandler: boolean,
  hostOverrideCommand: string,
  authenticationCommand: string,
  authenticationCommandArgumentName: string,
  flattenedParametersOnPSCmdlet: any,
  parameterAliasMapping: any,
  globalParametersStatic: any,
  filterBlock: string
): any {

  let outputTypeBlock = null;
  const info = swaggerDictInfo;
  const definitionList = swaggerDictDefinitions;
  const infoVersion = info.infoVersion;
  const clientName = '$' + info.ClientTypeName;
  const namespace = info.NameSpace;
  const fullClientTypeName = namespace + '.' + info.ClientTypeName;
  const subscriptionId = null;
  const baseUri = null;
  let advancedFunctionEndCodeBlock = '';
  let getServiceCredentialStr = 'Get-AzServiceCredential';

  let parameterSetBasedMethodStr = '';
  let resourceIdParamCodeBlock = '';
  for (const parameterSetDetail of parameterSetDetails) {

    if ((parameterSetDetail.OperationId !== parameterSetDetail.ParameterSetName) &&
      (parameterSetDetail.ParameterSetName.toLowerCase().startsWith('InputObject_'.toLowerCase()) ||
        parameterSetDetail.ParameterSetName.toLowerCase().startsWith('ResourceId_'.toLowerCase()))) {
      continue;
    }

    // Responses isn't actually used right now, but keeping this when we need to handle responses per parameter set
    const responses = parameterSetDetail.Responses;
    const operationId = parameterSetDetail.OperationId;
    const parameterSetName = parameterSetDetail.ParameterSetName;
    const methodName = parameterSetDetail.MethodName;
    const operations = parameterSetDetail.Operations;
    const paramList = parameterSetDetail.ExpandedParamList;
    let cmdlet = parameterSetDetail.Cmdlet || '';
    let cmdletArgs = parameterSetDetail.CmdletArgs || '';

    if (responses) {
      const getResponseResult = getResponse(responses, namespace, info.Models, definitionList);
      // For now, use the first non-empty output type
      if (!outputTypeBlock && getResponseResult.outputTypeBlock) {
        outputTypeBlock = getResponseResult.outputTypeBlock;
      }
    }

    const methodBlock = methodName
      ? methodBlockFunctionCall(clientName, operations, methodName, paramList)
      : methodBlockCmdletCall(cmdlet, cmdletArgs);
    let additionalConditionStart = '';
    let additionalConditionEnd = '';
    if (parameterSetDetail.AdditionalConditions) {
      if (parameterSetDetail.AdditionalConditions.length === 1) {
        additionalConditionStart = `      if (${parameterSetDetail.AdditionalConditions[0]}) {\r\n`;
        additionalConditionEnd = "\r\n      } else { $taskResult = $null }";
      } else if (parameterSetDetail.AdditionalConditions.length > 1) {
        additionalConditionStart = "      if (";
        for (const condition of parameterSetDetail.AdditionalConditions) {
          additionalConditionStart += `(${condition}) -and`;
        }
        additionalConditionStart = additionalConditionStart.slice(0, -5);
        additionalConditionStart = ") {\r\n"
        additionalConditionEnd = "\r\n      } else { $taskResult = $null }"
      }
    }

    let ParameterSetConditions = [`'${parameterSetDetail.ParameterSetName}' -eq $PsCmdlet.ParameterSetName`];
    if (parameterSetDetail.ClonedParameterSetNames) {
      let CloneParameterSetConditions = []
      for (const cpsn of parameterSetDetail.ClonedParameterSetNames) {
        const p = `'${cpsn}' -eq $PsCmdlet.ParameterSetName`;
        CloneParameterSetConditions.push(p);
        ParameterSetConditions.push(p);
      }

      if (CloneParameterSetConditions) {
        if (parameterSetDetail.ResourceIdParameters) {
          resourceIdParamCodeBlock += `if(${CloneParameterSetConditions.join(' -or ')}) {
            $GetArmResourceIdParameterValue_params = @{
            IdTemplate = '${parameterSetDetail.EndpointRelativePath}'
        }

        if('ResourceId_${parameterSetDetail.ParameterSetName}' -eq $PsCmdlet.ParameterSetName) {
            $GetArmResourceIdParameterValue_params['Id'] = $ResourceId
          }
        else {
            $GetArmResourceIdParameterValue_params['Id'] = $InputObject.Id
          }
          $ArmResourceIdParameterValues = Get-ArmResourceIdParameterValue @GetArmResourceIdParameterValue_params`;
          for (const p of parameterSetDetail.ResourceIdParameters) {
            resourceIdParamCodeBlock += `
        $${p} = $ArmResourceIdParameterValues['${p}']\n`;
          }
          resourceIdParamCodeBlock += "    }";
        }
      }
    }

    const parameterSetConditionsStr = ParameterSetConditions.join(' -or ');
    if (parameterSetBasedMethodStr) {
      // Add the elseif condition
      parameterSetBasedMethodStr += parameterSetBasedMethodStrElseIfCase(parameterSetConditionsStr, additionalConditionStart, methodBlock, additionalConditionEnd);
    } else {
      // Add the beginning if condition
      parameterSetBasedMethodStr += parameterSetBasedMethodStrIfCase(parameterSetConditionsStr, additionalConditionStart, methodBlock, additionalConditionEnd);
    }
  }

  // Prepare the code block for constructing the actual operation parameters which got flattened on the generated cmdlet.
  let flattenedParametersBlock = '';
  for (const name in flattenedParametersOnPSCmdlet) {
    let definitionDetails = flattenedParametersOnPSCmdlet[name];
    let flattenedParametersList = definitionDetails.ParametersTable.map(p => p.Name);
    let flattenedParametersListStr = flattenedParametersList
      ? `@('${flattenedParametersList.join("', '")}')`
      : '';

    flattenedParametersBlock += constructFlattenedParameter(flattenedParametersListStr, definitionDetails.Name, name);
  }

  let parameterAliasMappingBlock = Object.keys(parameterAliasMapping)
    .map(key => `$${key} = $${parameterAliasMapping[key]}\n`)
    .join('');

  let bodyHelper1 = "";

  if (authenticationCommand) {
    bodyHelper1 += `
    $NewServiceClient_params['AuthenticationCommand'] = @'
    ${authenticationCommand}
'@ `;
    if (authenticationCommandArgumentName) {
      bodyHelper1 += `
    $NewServiceClient_params['AuthenticationCommandArgumentList'] = $${authenticationCommandArgumentName}`;
    }
  }
  if (addHttpClientHandler) {
    bodyHelper1 += `
    $NewServiceClient_params['AddHttpClientHandler'] = $true
    $NewServiceClient_params['Credential']           = $Credential`;
  }
  if (hostOverrideCommand) {
    bodyHelper1 += `
    $NewServiceClient_params['HostOverrideCommand'] = @'
    ${hostOverrideCommand}
'@`;
  }
  if (globalParameters || globalParametersStatic) {
    bodyHelper1 += `
    $GlobalParameterHashtable = @{}
    $NewServiceClient_params['GlobalParameterHashtable'] = $GlobalParameterHashtable
`;
  }
  if (globalParameters) {
    for (const parameter of globalParameters) {
      bodyHelper1 += `
    $GlobalParameterHashtable['${parameter}'] = $null
    if($PSBoundParameters.ContainsKey('${parameter}')) {
        $GlobalParameterHashtable['${parameter}'] = $PSBoundParameters['${parameter}']
    }
`;
    }
  }
  if (globalParametersStatic) {
    for (const name in globalParametersStatic) {
      bodyHelper1 += `
    $GlobalParameterHashtable['${name}'] = ${globalParametersStatic[name]}
`;
    }
  }

  let bodyHelper2 = "";
  if (oDataExpressionBlock) bodyHelper2 += oDataExpressionBlock;
  if (parameterGroupsExpressionBlock) bodyHelper2 += parameterGroupsExpressionBlock;
  if (flattenedParametersBlock) bodyHelper2 += flattenedParametersBlock;
  if (parameterAliasMappingBlock) bodyHelper2 += parameterAliasMappingBlock;
  if (resourceIdParamCodeBlock) bodyHelper2 += resourceIdParamCodeBlock;


  const body = `

    $ErrorActionPreference = 'Stop'

    $NewServiceClient_params = @{
        FullClientTypeName = '${fullClientTypeName}'
    }
${bodyHelper1}
    ${clientName} = New-ServiceClient @NewServiceClient_params
${bodyHelper2}
${filterBlock || ""}
    ${parameterSetBasedMethodStr} else {
        Write-Verbose -Message 'Failed to map parameter set to operation method.'
        throw 'Module failed to find operation to execute.'
    }
`;

  return {
    BodyObject: {
      OutputTypeBlock: outputTypeBlock,
      Body: body
    },
    ParameterSetDetails: parameterSetDetails
  };
}

function addUniqueParameter(parameterDetails: any, candidateParameterDetails: any, parameterSetName: string, parametersToAdd: any, parameterHitCount: any) {
  const parameterName = candidateParameterDetails.Name;
  if (parameterDetails.IsParameter) {
    if (!parameterHitCount[parameterName]) {
      parameterHitCount[parameterName] = 0;
    }

    parameterHitCount[parameterName]++;
    if (!parametersToAdd[parameterName]) {
      parametersToAdd[parameterName] = {
        // We can grab details like Type, Name, ValidateSet from any of the parameter definitions
        Details: candidateParameterDetails,
        ParameterSetInfo: {
          ParameterSetName: {
            Name: parameterSetName,
            Mandatory: candidateParameterDetails.Mandatory
          }
        }
      };
    }
    else {
      parametersToAdd[parameterName].ParameterSetInfo[parameterSetName] = {
        Name: parameterSetName,
        Mandatory: candidateParameterDetails.Mandatory
      }
    }
  }
}

function getValueText(obj: any) {
  switch (typeof obj) {
    case "string": return `'${obj}'`;
    case "boolean": return `$${obj}`;
    default: return obj;
  }
}

function newSwaggerSpecPathCommand(
  clientName: string,
  swaggerDictSecurity: any,
  swaggerDictSecurityDefinitions: any,
  swaggerDictInfo: any,
  swaggerDictDefinitions: any,
  swaggerDictCommandDefaults: any,
  useAzureCsharpGenerator: boolean,
  psCodeGen: any,
  definitionFunctionsDetails: any,
  pathFunctionDetails: any,
  outputDirectory: string,
  psHeaderComment: string) {

  // preprocess paging operations
  for (const f of Object.values(pathFunctionDetails)) {
    for (const parameterSetDetail of Object.values(f)) {
      if (parameterSetDetail['x-ms-pageable'] && 'operationName' in parameterSetDetail['x-ms-pageable']) {
        const matchingPath = pathFunctionDetails.filter(x => x.ParameterSetDetails.OperationId === parameterSetDetail['x-ms-pageable']['operationName'])[0];
        matchingPath['IsNextPageOperation'] = true;
      }
    }
  }

  return Object.values(pathFunctionDetails).map(functionDetails => newSwaggerPath(
    clientName,
    swaggerDictSecurity,
    swaggerDictSecurityDefinitions,
    swaggerDictInfo,
    swaggerDictDefinitions,
    swaggerDictCommandDefaults,
    useAzureCsharpGenerator,
    psCodeGen,
    definitionFunctionsDetails,
    pathFunctionDetails,
    functionDetails,
    outputDirectory,
    psHeaderComment));
}

function newSwaggerPath(
  clientName: string,
  swaggerDictSecurity: any,
  swaggerDictSecurityDefinitions: any,
  swaggerDictInfo: any,
  swaggerDictDefinitions: any,
  swaggerDictCommandDefaults: any,
  useAzureCsharpGenerator: boolean,
  psCodeGen: any,
  definitionFunctionsDetails: any,
  pathFunctionDetails: any,
  functionDetails: any,
  outputDirectory: string,
  psHeaderComment: string): any {

  const isNextPageOperation: boolean = !!functionDetails.IsNextPageOperation;

  const commandName = functionDetails.CommandName;
  const parameterSetDetails = functionDetails.ParameterSetDetails;
  const isLongRunningOperation = functionDetails['x-ms-long-running-operation'];

  let parametersToAdd: any = {};
  let flattenedParametersOnPSCmdlet = {};
  let parameterHitCount = {};
  let globalParameters = [];
  let globalParametersStatic = {};
  let filterBlock = null;
  // Process global metadata for commands
  if (swaggerDictCommandDefaults) {
    for (const entry in swaggerDictCommandDefaults) {
      globalParametersStatic[entry] = getValueText(swaggerDictCommandDefaults[entry]);
    }
  }

  // Process metadata for the overall command
  if ('Metadata' in functionDetails) {
    if (functionDetails.Metadata.ClientParameters) {
      for (const property of functionDetails.Metadata.ClientParameters) {
        globalParametersStatic[property.Name] = getValueText(functionDetails.Metadata.ClientParameters[property.Name]);
      }
    }
    if (functionDetails.Metadata.clientSideFilters) {
      for (const clientSideFilter of functionDetails.Metadata.ClientSideFilters) {
        for (const filter of clientSideFilter.Filters) {
          if (filter.Type === 'wildcard') {
            if (!filter.Character) {
              filter.Character = psCodeGen['defaultWildcardChar'];
            }
          }
        }
        const matchingParameters: string[] = [];
        let serverSideFunctionDetails = null;
        if (clientSideFilter.ServerSideResultCommand === '.') {
          serverSideFunctionDetails = functionDetails;
        }
        else {
          serverSideFunctionDetails = pathFunctionDetails[clientSideFilter.ServerSideResultCommand];
        }
        if (!serverSideFunctionDetails) {
          logWarning(`Couldn't find server-side result operation: ${clientSideFilter.ServerSideResultCommand}`);
        }
        else {
          const serverSideParameterSet = serverSideFunctionDetails['ParameterSetDetails'].filter(x => x.OperationId === clientSideFilter.ServerSideResultParameterSet);
          if (!serverSideParameterSet) {
            // Warning: Couldn't find specified server-side parameter set
            logWarning(`Couldn't find server-side result parameter set: ${clientSideFilter.ServerSideResultParameterSet}`);
          }
          else {
            const clientSideParameterSet = parameterSetDetails.filter(x => x.OperationId === clientSideFilter.ClientSideParameterSet)[0];
            if (!clientSideParameterSet) {
              logWarning(`Couldn't find client-side parameter set: ${clientSideFilter.ClientSideParameterSet}`);
            }
            else {
              let valid = true;
              for (const parametersDetail of serverSideParameterSet.ParameterDetails) {
                for (const parameterDetailEntry of parametersDetail) {
                  if (parameterDetailEntry.Mandatory === '$true' &&
                    (!('ReadOnlyGlobalParameter' in parameterDetailEntry) || parameterDetailEntry.ReadOnlyGlobalParameter) &&
                    (!('ConstantValue' in parameterDetailEntry) || parameterDetailEntry.ConstantValue)) {
                    let clientSideParameter = null;
                    for (const pd of clientSideParameterSet.ParameterDetails) {
                      for (const entry of pd) {
                        if ((entry.Mandatory === '$true') && (entry.Name === parameterDetailEntry.Name)) {
                          clientSideParameter = entry;
                        }
                      }
                    }
                    if (!clientSideParameterSet) {
                      // Warning: Missing client-side parameter
                      logWarning(`Required server-side parameter '${parameterDetailEntry.Name}' is not required by the client-side, which will cause issues in client-side filtering. Can't include client-side filtering.`);
                    }
                    else {
                      matchingParameters.push(parameterDetailEntry.Name);
                    }
                  }
                }
              }

              if (valid) {
                filterBlock = filterBlockStr(commandName, clientSideFilter, matchingParameters);
              }
            }
          }
        }
        // If this is filled out, means that all the inputs were validated (except maybe the filter details)
        if (filterBlock) {
          for (const filter of clientSideFilter.Filters) {
            if (filter.appendParameterInfo) {
              const parameterDetails = {
                'Name': getPascalCasedString(filter.Parameter),
                'Mandatory': '$false',
                'Type': filter.AppendParameterInfo.Type,
                'ValidateSet': '',
                'Description': 'Filter parameter',
                'IsParameter': true
              };
              addUniqueParameter(parameterDetails, parameterDetails, clientSideFilter.ClientSideParameterSet, parametersToAdd, parameterHitCount); // TODO
            }
          }
        }
      }
    }
  }

  let x_ms_pageableObject = null;
  for (const parameterSetDetail of parameterSetDetails) {
    if (parameterSetDetail['x-ms-pageable'] && !isNextPageOperation) {
      if (x_ms_pageableObject &&
        x_ms_pageableObject.ReturnType &&
        x_ms_pageableObject.ReturnType !== 'NONE' &&
        x_ms_pageableObject.ReturnType !== parameterSetDetail.ReturnType) {
        logWarning(`Multiple page return types found, unable to generate -Page parameter with a strong type for cmdlet '${commandName}'.`)
        x_ms_pageableObject.ReturnType = 'NONE';
      }
      else if (!x_ms_pageableObject) {
        x_ms_pageableObject = parameterSetDetail['x-ms-pageable'];
        x_ms_pageableObject['ReturnType'] = parameterSetDetail.ReturnType;
        if ("PSCmdletOutputItemType" in parameterSetDetail) {
          x_ms_pageableObject['PSCmdletOutputItemType'] = parameterSetDetail.PSCmdletOutputItemType;
        }
        if ('operationName' in x_ms_pageableObject) {
          // Search for the cmdlet with a parameter set with the given operationName
          const pagingFunctionDetails = pathFunctionDetails.filter(x => x.ParameterSetDetails.OperationId === x_ms_pageableObject.operationName)[0];
          if (!pagingFunctionDetails) {
            throw `Failed to find specified next page operation with operationId '${x_ms_pageableObject.OperationName}' for cmdlet '${commandName}'.`;
          }

          const pagingParameterSet = pagingFunctionDetails.Value.ParameterSetDetails.filter(x => x.OperationId === x_ms_pageableObject.operationName);
          const unmatchedParameters = [];
          // This list of parameters works for when -Page is called...
          let cmdletArgsPageParameterSet = ''
          // ...and this list of parameters works for when unrolling paged results (when -Paging is not used)
          let cmdletArgsNoPaging = ''
          for (const pagingParameter of pagingParameterSet.ParameterDetails) {
            // Ignore parameters that are readonly or have a constant value
            if (pagingParameter.ReadOnlyGlobalParameter) {
              continue;
            }

            if (pagingParameter.ConstantValue) {
              continue;
            }

            const matchingCurrentParameter = Object.values(parameterSetDetail.ParameterDetails).filter(x => x.Name === pagingParameter.Name)[0];
            if (matchingCurrentParameter) {
              cmdletArgsPageParameterSet += "-$($pagingParameter.Name) `$$($pagingParameter.Name) ";
              cmdletArgsNoPaging += "-$($pagingParameter.Name) `$$($pagingParameter.Name) ";
            }
            else {
              unmatchedParameters.push(pagingParameter);
              cmdletArgsPageParameterSet += "-$($pagingParameter.Name) `$Page.NextPageLink ";
              cmdletArgsNoPaging += "-$($pagingParameter.Name) `$result.NextPageLink ";
            }
          }

          if (unmatchedParameters.length !== 1) {
            throw `PSSwagger requires that the NextLink operation contains exactly one parameter different than the original operation, where the different parameter is used to pass the nextLink value to the NextLink operation. Current cmdlet: '${commandName}'. NextLink operation: '${pagingFunctionDetails.Value.CommandName}'`;
          }

          x_ms_pageableObject['Cmdlet'] = pagingFunctionDetails.Value.CommandName;
          x_ms_pageableObject['CmdletArgsPage'] = cmdletArgsPageParameterSet.trim();
          x_ms_pageableObject['CmdletArgsPaging'] = cmdletArgsNoPaging.trim();
        }
        else {
          x_ms_pageableObject['Operations'] = parameterSetDetail.Operations;
          x_ms_pageableObject['MethodName'] = "$($parameterSetDetail.MethodName.Substring(0, $parameterSetDetail.MethodName.IndexOf('WithHttpMessagesAsync')))NextWithHttpMessagesAsync";
        }
      }
    }

    for (const parameterDetails of Object.values(parameterSetDetail.ParameterDetails)) {
      let parameterRequiresAdding = true;
      if ('client' === parameterDetails.x_ms_parameter_location) {
        // Check if a global has been added already
        if ("$($parameterDetails.Name)Global" in parametersToAdd) {
          parameterRequiresAdding = false;
        }
        else if (parameterDetails.ReadOnlyGlobalParameter) {
          parameterRequiresAdding = false;
        }
        else {
          const globalParameterName = parameterDetails.Name;
          if (parameterDetails.ConstantValue) {
            // A parameter with a constant value doesn't need to be in the parameter block
            parameterRequiresAdding = false;
          }
          globalParameters += globalParameterName;
        }
      }

      if (parameterRequiresAdding) {
        if ('x_ms_parameter_grouping_group' in parameterDetails) {
          for (const parameterDetailEntry of parameterDetails.x_ms_parameter_grouping_group) {
            addUniqueParameter(parameterDetails, parameterDetailEntry, parameterSetDetail.ParameterSetName, parametersToAdd, parameterHitCount);
          }
        }
        else if (parameterDetails.FlattenOnPSCmdlet) {
          const DefinitionName = parameterDetails.Type.Split('[.]').reverse()[0];
          if (DefinitionName in definitionFunctionsDetails) {
            const DefinitionDetails = definitionFunctionsDetails[DefinitionName];
            flattenedParametersOnPSCmdlet[parameterDetails.Name] = DefinitionDetails;
            for (const x of DefinitionDetails.ParametersTable) {
              addUniqueParameter(parameterDetails, x, parameterSetDetail.ParameterSetName, parametersToAdd, parameterHitCount);
            }
          }
          else {
            throw `Flatten property is specified as 'true' for an invalid parameter '${parameterDetails.Name}' with type '${parameterDetails.Type}'.`;
          }
        }
        else {
          addUniqueParameter(parameterDetails, parameterDetails, parameterSetDetail.ParameterSetName, parametersToAdd, parameterHitCount);
        }
      }
      else {
        // This magic string is here to distinguish local vs global parameters with the same name, e.g. in the Azure Resources API
        parametersToAdd[`${parameterDetails.Name}Global`] = null;
      }
    }
  }

  let topParameterToAdd = null;
  let skipParameterToAdd = null;
  let pagingBlock = '';
  let pagingOperationName = '';
  let nextLinkName = 'NextLink';
  let pagingOperations = '';
  let cmdlet = '';
  let cmdletArgs = '';
  let pageType = 'Array';
  let psCmdletOutputItemType = '';

  if (x_ms_pageableObject) {
    if (x_ms_pageableObject.ReturnType !== 'NONE') {
      pageType = x_ms_pageableObject.ReturnType;
      if (x_ms_pageableObject.psCmdletOutputItemType) {
        psCmdletOutputItemType = x_ms_pageableObject.psCmdletOutputItemType;
      }
    }

    if (x_ms_pageableObject.Operations) {
      pagingOperations = x_ms_pageableObject.Operations;
      pagingOperationName = x_ms_pageableObject.MethodName;
    }
    else {
      cmdlet = x_ms_pageableObject.Cmdlet;
      cmdletArgs = x_ms_pageableObject.CmdletArgsPaging;
    }

    if (x_ms_pageableObject.NextLinkName) {
      nextLinkName = x_ms_pageableObject.NextLinkName;
    }

    topParameterToAdd = {
      Details: {
        Name: 'Top',
        Type: 'int',
        Mandatory: '$false',
        Description: 'Return the top N items as specified by the parameter value. Applies after the -Skip parameter.',
        IsParameter: true,
        ValidateSet: null,
        ExtendedData: {
          Type: 'int',
          HasDefaultValue: true,
          DefaultValue: -1
        }
      },
      ParameterSetInfo: {}
    };

    skipParameterToAdd = {
      Details: {
        Name: 'Skip',
        Type: 'int',
        Mandatory: '$false',
        Description: 'Skip the first N items as specified by the parameter value.',
        IsParameter: true,
        ValidateSet: null,
        ExtendedData: {
          Type: 'int',
          HasDefaultValue: true,
          DefaultValue: -1
        }
      },
      ParameterSetInfo: {}
    };
  }


  let authenticationCommand: string = "";
  let authenticationCommandArgumentName: string = "";

  // Process security section
  let hostOverrideCommand: string = "";
  // CustomAuthCommand and HostOverrideCommand are not required for Arm Services
  if (psCodeGen['ServiceType'] !== 'azure_stack' && psCodeGen['ServiceType'] ===/*TODO: bug?*/ 'azure_stack') {
    if (psCodeGen.CustomAuthCommand) {
      authenticationCommand = psCodeGen.CustomAuthCommand;
    }
    if (psCodeGen.HostOverrideCommand) {
      hostOverrideCommand = psCodeGen.HostOverrideCommand;
    }
  }

  let securityParametersToAdd: any[] = [];
  let addHttpClientHandler = false;

  // If the auth function hasn't been set by metadata, try to discover it from the security and securityDefinition objects in the spec
  if (!authenticationCommand && !useAzureCsharpGenerator) {
    if (swaggerDictSecurity) {
      // For now, just take the first security object
      if (swaggerDictSecurity.length > 1) {
        logWarning(`Multiple security requirements are currently unsupported. Only the first security requirement is being considered for command '${commandName}'.`)
      }
      const firstSecurityObject = swaggerDictSecurity[0];
      // If there's no security object, we don't care about the security definition object
      if (firstSecurityObject) {
        // If there is one, we need to know the definition
        if (!swaggerDictSecurityDefinitions) {
          throw "Security object was specified in the Swagger specification, but the Security Definition object was not.";
        }

        const securityDefinition = swaggerDictSecurityDefinitions[firstSecurityObject.Name];
        if (!securityDefinition) {
          throw `Security definition with name '${firstSecurityObject.Name}' is missing.`;
        }

        if (!securityDefinition.type) {
          throw `API key security definition '${firstSecurityObject.Name}' is missing the 'type' property.`;
        }

        const type = securityDefinition.type;
        if (type === 'basic') {
          // For Basic Authentication, allow the user to pass in a PSCredential object.
          const credentialParameter = {
            Details: {
              Name: 'Credential',
              Type: 'PSCredential',
              Mandatory: '$true',
              Description: 'User credentials.',
              IsParameter: true,
              ValidateSet: null,
              ExtendedData: {
                Type: 'PSCredential',
                HasDefaultValue: false
              }
            },
            ParameterSetInfo: {}
          };
          securityParametersToAdd.push({
            Parameter: credentialParameter,
            IsConflictingWithOperationParameter: false
          });
          // If the service is specified to not issue authentication challenges, we can't rely on HttpClientHandler
          if (psCodeGen.NoAuthChallenge) {
            authenticationCommand = 'param([pscredential]$Credential) Get-AutoRestCredential -Credential $Credential';
            authenticationCommandArgumentName = 'Credential';
          }
          else {
            // Use an empty service client credentials object because we're using HttpClientHandler instead
            authenticationCommand = 'Get-AutoRestCredential';
            addHttpClientHandler = true;
          }
        }
        else if (type === 'apiKey') {
          if (!securityDefinition.name) {
            throw `API key security definition '${firstSecurityObject.Name}' is missing the 'name' property.`;
          }

          if (!securityDefinition.in) {
            throw `API key security definition '${firstSecurityObject.Name}' is missing the 'in' property.`;
          }

          // For API key authentication, the user should supply the API key, but the in location and the name are generated from the spec
          // In addition, we'd be unable to authenticate without the API key, so make it mandatory
          const credentialParameter = {
            Details: {
              Name: 'APIKey',
              Type: 'string',
              Mandatory: '$true',
              Description: 'API key given by service owner.',
              IsParameter: true,
              ValidateSet: null,
              ExtendedData: {
                Type: 'string',
                HasDefaultValue: false
              }
            },
            ParameterSetInfo: {}
          };
          securityParametersToAdd.push({
            Parameter: credentialParameter,
            IsConflictingWithOperationParameter: false
          });
          authenticationCommand = `param([string]$APIKey) Get-AutoRestCredential -APIKey $APIKey -Location '${securityDefinition.in}' -Name '${securityDefinition.name}'`;
          authenticationCommandArgumentName = 'APIKey';
        }
        else {
          logWarning(`Authentication type '${type}' is not supported by PSSwagger. The generated module will default to no authentication unless overridden.`)
        }
      }
    }
  }

  if (!authenticationCommand && !useAzureCsharpGenerator) {
    // At this point, there was no supported security object or overridden auth function, so assume no auth
    authenticationCommand = 'Get-AutoRestCredential';
  }

  const nonUniqueParameterSets: any[] = [];
  for (const parameterSetDetail of parameterSetDetails) {
    // Add parameter sets to paging parameter sets
    if (topParameterToAdd && parameterSetDetail['x-ms-pageable'] && !isNextPageOperation) {
      topParameterToAdd.ParameterSetInfo[parameterSetDetail.ParameterSetName] = {
        Name: parameterSetDetail.ParameterSetName,
        Mandatory: '$false'
      };
    }

    if (skipParameterToAdd && parameterSetDetail['x-ms-pageable'] && !isNextPageOperation) {
      skipParameterToAdd.ParameterSetInfo[parameterSetDetail.ParameterSetName] = {
        Name: parameterSetDetail.ParameterSetName,
        Mandatory: '$false'
      };
    }

    const parameterConflictAndResult = (x0: string, x1: string, x2: string, x3: string) => `Parameter '${x0}' from cmdlet '${x1}' and parameter set '${x2}' conflicts with an autogenerated parameter. ${x3}`;

    // Test for uniqueness of parameters
    for (const parameterDetails of Object.values(parameterSetDetail.ParameterDetails)) {
      // Check if the paging parameters are conflicting
      // Note that this has to be moved elsewhere to be more generic, but this is temporarily located here to solve this scenario for paging at least
      if (topParameterToAdd && parameterDetails.Name === 'Top') {
        topParameterToAdd = null;
        // If the parameter is not OData, full paging support isn't possible.
        if (!parameterDetails.ExtendedData.IsODataParameter) {
          logWarning(parameterConflictAndResult('Top', commandName, parameterSetDetail.OperationId, "As a result, full paging capabilities will not be supported."))
        }
      }

      if (skipParameterToAdd && parameterDetails.Name === 'Skip') {
        skipParameterToAdd = null;
        // If the parameter is not OData, full paging support isn't possible.
        if (!parameterDetails.ExtendedData.IsODataParameter) {
          logWarning(parameterConflictAndResult('Skip', commandName, parameterSetDetail.OperationId, "As a result, full paging capabilities will not be supported."))
        }
      }

      for (const additionalParameter of securityParametersToAdd) {
        if (parameterDetails.Name === additionalParameter.Parameter.Details.Name) {
          additionalParameter.IsConflictingWithOperationParameter = true;
          logWarning(parameterConflictAndResult(additionalParameter.Parameter.Details.Name, commandName, parameterSetDetail.ParameterSetName, "As a result, the -Credential parameter of type PSCredential will not added, and the specification-specified parameter will be used instead."))
        }
      }

      if (parameterHitCount[parameterDetails.Name] === 1) {
        // continue here brings us back to the top of the $parameterSetDetail.ParameterDetails.GetEnumerator() | ForEach-Object loop
        continue;
      }
    }

    // At this point none of the parameters in this set are unique
    nonUniqueParameterSets.push(parameterSetDetail);
  }

  if (topParameterToAdd) {
    parametersToAdd[topParameterToAdd.Details.Name] = topParameterToAdd;
  }

  if (skipParameterToAdd) {
    parametersToAdd[skipParameterToAdd.Details.Name] = skipParameterToAdd;
  }

  for (const additionalParameter of securityParametersToAdd) {
    if (!additionalParameter.IsConflictingWithOperationParameter) {
      parametersToAdd[additionalParameter.Parameter.Details.Name] = additionalParameter.Parameter;
    }
  }


  let pagingOperationCall: string | null = null;
  if (pagingOperations) {
    pagingOperationCall = pagingOperationCallFunction(clientName, pagingOperations, pagingOperationName, nextLinkName);
  }
  else if (cmdlet) {
    pagingOperationCall = pagingOperationCallCmdlet(cmdlet, cmdletArgs);
  }

  let pageResultPagingObjectStr: string | null = null;
  let topPagingObjectStr: string | null = null;
  let skipPagingObjectStr: string | null = null;
  let pageTypePagingObjectStr: string | null = null;

  if (pagingOperationCall) {
    pagingBlock = pagingBlockStrGeneric(pagingOperationCall, nextLinkName);
    pageResultPagingObjectStr = `
@{
            'Result' = $null
        }
`;
    pageTypePagingObjectStr = pageTypeObjectBlock(pageType);
    if (topParameterToAdd) {
      topPagingObjectStr = `
@{
            'Count' = 0
            'Max' = $Top
        }
`;
    }

    if (skipParameterToAdd) {
      skipPagingObjectStr = `
@{
            'Count' = 0
            'Max' = $Skip
        }
`;
    }
  }

  let defaultParameterSetName: string = "";
  let description: string = "";
  let synopsis: string = "";
  // For description, we're currently using the default parameter set's description, since concatenating multiple descriptions doesn't ever really work out well.
  if (nonUniqueParameterSets.length > 1) {
    // Pick the highest priority set among nonUniqueParameterSets, but really it doesn't matter, cause...
    // Print warning that this generated cmdlet has ambiguous parameter sets
    const defaultParameterSet = nonUniqueParameterSets.sort((a, b) => a.Priority - b.Priority)[0];
    defaultParameterSetName = defaultParameterSet.ParameterSetName;
    description = defaultParameterSet.Description;
    synopsis = defaultParameterSet.Synopsis;
    logWarning(`The generated cmdlet '${commandName}' contains ambiguous parameter sets. This is due to automatic merging of two or more similar paths.`)
  }
  else if (nonUniqueParameterSets.length === 1) {
    // If there's only one non-unique, we can prevent errors by making this the default
    defaultParameterSetName = nonUniqueParameterSets[0].ParameterSetName;
    description = nonUniqueParameterSets[0].Description;
    synopsis = nonUniqueParameterSets[0].Synopsis;
  }
  else {
    // Pick the highest priority set among all sets
    const defaultParameterSet = parameterSetDetails.sort((a, b) => a.Priority - b.Priority)[0];
    defaultParameterSetName = defaultParameterSet.ParameterSetName;
    description = defaultParameterSet.Description;
    synopsis = defaultParameterSet.Synopsis;
  }
  const commandHelp = helpDescStr(synopsis, description);


  const parameterAliasMapping = {};
  let oDataExpression = "";
  let paramBlock = "";
  let paramHelp = "";
  let parameterGroupsExpressionBlock = "";
  const parameterGroupsExpressions = {};

  for (const parameterToAdd of Object.values(parametersToAdd)) {
    let ValueFromPipelineString = '';
    let ValueFromPipelineByPropertyNameString = '';
    if (parameterToAdd) {
      let parameterName = parameterToAdd.Details.Name;

      if (parameterToAdd.Details.ValueFromPipeline) {
        ValueFromPipelineString = ', ValueFromPipeline = $true';
      }

      if (parameterToAdd.Details.ValueFromPipelineByPropertyName) {
        ValueFromPipelineByPropertyNameString = ', ValueFromPipelineByPropertyName = $true';
      }

      let AllParameterSetsString = '';
      for (const parameterSetInfo of Object.values(parameterToAdd.ParameterSetInfo)) {
        const ParameterSetPropertyString = `, ParameterSetName = '${parameterSetInfo.Name}'`;
        if (AllParameterSetsString) {
          // Two tabs
          AllParameterSetsString += "\r\n        " + parameterAttributeString(parameterSetInfo.Mandatory, ValueFromPipelineByPropertyNameString, ValueFromPipelineString, ParameterSetPropertyString);
        }
        else {
          AllParameterSetsString = parameterAttributeString(parameterSetInfo.Mandatory, ValueFromPipelineByPropertyNameString, ValueFromPipelineString, ParameterSetPropertyString);
        }
      }

      if (!AllParameterSetsString) {
        AllParameterSetsString = parameterAttributeString(parameterToAdd.Details.Mandatory, ValueFromPipelineByPropertyNameString, ValueFromPipelineString, "");
      }

      let ParameterAliasAttribute = null;
      // Parameter has Name as an alias, change the parameter name to Name and add the current parameter name as an alias.
      if (parameterToAdd.Details.Alias && parameterToAdd.Details.Alias.toLowerCase() === 'name') {
        parameterAliasMapping[parameterName] = 'Name';
        parameterName = 'Name';
        ParameterAliasAttribute = parameterAliasAttributeString(`'${parameterName}'`);
      }

      const paramName = "$" + parameterName;
      let ValidateSetDefinition = null
      if (parameterToAdd.Details.ValidateSet) {
        ValidateSetDefinition = validateSetDefinitionString(parameterToAdd.Details.ValidateSet);
      }

      let parameterDefaultValueOption = "";
      let paramType = "\r\n        ";
      if (parameterToAdd.Details.ExtendedData) {
        if (parameterToAdd.Details.ExtendedData.IsODataParameter) {
          paramType = `[${parameterToAdd.Details.Type}]${paramType}`;
          oDataExpression += `    if ($${parameterName}) { $oDataQuery += " & \`$${parameterName} = $${parameterName}" }\r\n`;
        }
        else {
          // Assuming you can't group ODataQuery parameters
          if (parameterToAdd.Details.x_ms_parameter_grouping) {
            const parameterGroupPropertyName = parameterToAdd.Details.Name;
            const groupName = parameterToAdd.Details.x_ms_parameter_grouping;
            parameterGroupsExpressions[groupName] =
              (groupName in parameterGroupsExpressions
                ? parameterGroupsExpressions[groupName]
                : parameterGroupCreateExpression(groupName, parameterToAdd.Details.ExtendedData.GroupType))
              + "\r\n"
              + parameterGroupPropertyExpression(groupName, parameterGroupPropertyName);
          }

          if (parameterToAdd.Details.ExtendedData.Type) {
            paramType = `[${parameterToAdd.Details.ExtendedData.Type}]${paramType}`;
            if (parameterToAdd.Details.ExtendedData.HasDefaultValue) {
              let parameterDefaultValue = "$null";
              if (parameterToAdd.Details.ExtendedData.DefaultValue) {
                if (typeof parameterToAdd.Details.ExtendedData.DefaultValue === "object") {
                  parameterDefaultValue = "[NullString]::Value";
                }
                else if ("System.String" === parameterToAdd.Details.ExtendedData.Type) {
                  parameterDefaultValue = `"${parameterToAdd.Details.ExtendedData.DefaultValue} "`
                }
                else {
                  parameterDefaultValue = `${parameterToAdd.Details.ExtendedData.DefaultValue}`;
                }
              }

              parameterDefaultValueOption = parameterDefaultValueString(parameterDefaultValue);
            }
          }
        }

        paramBlock += parameterDefString(AllParameterSetsString, ParameterAliasAttribute, ValidateSetDefinition, paramType, paramName, parameterDefaultValueOption)
        paramHelp += helpParamStr(parameterName, parameterToAdd.Details.Description)
      }
      else if (parameterToAdd.Details.Type) {
        paramType = `[${parameterToAdd.Details.Type}]${paramType}`;

        paramBlock += parameterDefString(AllParameterSetsString, ParameterAliasAttribute, ValidateSetDefinition, paramType, paramName, parameterDefaultValueOption)
        paramHelp += helpParamStr(parameterName, parameterToAdd.Details.Description)
      }
      else {
        logWarning(`Parameter '${parameterName}' does not have a corresponding parameter in the autogenerated C# code and is not an ODataQuery parameter. Leaving this parameter out of the PowerShell cmdlet '${commandName}'`);
      }
    }
  }

  for (const parameterGroupsExpressionEntry of Object.values(parameterGroupsExpressions)) {
    parameterGroupsExpressionBlock += parameterGroupsExpressionEntry + "\r\n";
  }

  const oDataExpressionBlock = oDataExpression !== "" ? oDataExpressionBlockStr(oDataExpression.trim()) : "";

  paramBlock = paramBlock.replace(/[\s,]*$/, "");

  // isLongRunningOperation stuff
  const paramBlockReplaceStr = isLongRunningOperation
    ? (paramBlock ? `${paramBlock},\r\n${asJobParameterString}` : asJobParameterString)
    : paramBlock;
  const pathFunctionBody = isLongRunningOperation
    ? pathFunctionBodyAsJob(pagingBlock, topPagingObjectStr, skipPagingObjectStr, pageResultPagingObjectStr, pageTypePagingObjectStr)
    : pathFunctionBodySynch(pagingBlock, topPagingObjectStr, skipPagingObjectStr, pageResultPagingObjectStr, pageTypePagingObjectStr);

  const pathGenerationPhaseResult = getPathFunctionBody(
    parameterSetDetails,
    oDataExpressionBlock,
    parameterGroupsExpressionBlock,
    globalParameters,
    swaggerDictInfo,
    swaggerDictDefinitions,
    useAzureCsharpGenerator,
    addHttpClientHandler,
    hostOverrideCommand,
    authenticationCommand,
    authenticationCommand && authenticationCommandArgumentName,
    flattenedParametersOnPSCmdlet,
    parameterAliasMapping,
    globalParametersStatic,
    filterBlock
  );

  const bodyObject = pathGenerationPhaseResult.BodyObject;

  const outputTypeBlock = psCmdletOutputItemType
    ? outputTypeStr(psCmdletOutputItemType)
    : bodyObject.OutputTypeBlock;

  const dependencyInitFunction = useAzureCsharpGenerator
    ? "Initialize-PSSwaggerDependencies -Azure"
    : "Initialize-PSSwaggerDependencies";

  const commandString = advFnSignatureForPath(commandName, commandHelp, paramHelp, outputTypeBlock, paramBlockReplaceStr, dependencyInitFunction, bodyObject.Body, pathFunctionBody, defaultParameterSetName);
  const commandFilePath = `${outputDirectory}/${gneratedCommandsName}/SwaggerPathCommands/${commandName}.ps1`;
  CreateDirectoryFor(commandFilePath);

  writeFileSync(commandFilePath, getFormattedFunctionContent(psHeaderComment + commandString));
  logVerbose(`Generated path command '${commandName}'.`);

  return commandName;
}

const { dirname } = require("path");
const { mkdirSync, existsSync, writeFileSync } = require("fs");
function CreateDirectoryFor(filePath: string): void {
  var dir: string = dirname(filePath);
  if (!existsSync(dir)) {
    CreateDirectoryFor(dir);
    try {
      mkdirSync(dir);
    } catch (e) {
      // mkdir throws if directory already exists - which happens occasionally due to race conditions
    }
  }
}

function getFormattedFunctionContent(content: string) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}


// TEMPLATE
const gneratedCommandsName = 'Generated.PowerShell.Commands'

const outputTypeStr = (fullPathDataType: string): string => `
        [OutputType([${fullPathDataType}])]
`;

const parameterAttributeString = (isParamMandatory: boolean, valueFromPipelineByPropertyNameString: string, valueFromPipelineString: string, parameterSetPropertyString: string): string =>
  `[Parameter(Mandatory = ${isParamMandatory}${valueFromPipelineByPropertyNameString}${valueFromPipelineString}${parameterSetPropertyString})]`;

const parameterAliasAttributeString = (aliasString: string) => `
        [Alias(${aliasString})]
`;

const validateSetDefinitionString = (validateSetString: string) => `
        [ValidateSet(${validateSetString})]
`;

const parameterGroupCreateExpression = (groupName: string, fullGroupName: string) => `
$${groupName} = New-Object -TypeName ${fullGroupName}
`;

const parameterGroupPropertyExpression = (groupName: string, parameterGroupPropertyName: string) => `
    if ($PSBoundParameters.ContainsKey('${parameterGroupPropertyName}')) { $${groupName}.${parameterGroupPropertyName} = $${parameterGroupPropertyName} }
`;

const parameterDefString = (allParameterSetsString: string, parameterAliasAttribute: string, validateSetDefinition: string, paramType: string, paramName: string, parameterDefaultValueOption: string) => `
        ${allParameterSetsString || ""}${parameterAliasAttribute || ""}${validateSetDefinition || ""}
        ${paramType}${paramName}${parameterDefaultValueOption || ""},
`;

const helpParamStr = (parameterName: string, pDescription: string) => `
.PARAMETER ${parameterName}
    ${pDescription}
`;

const parameterDefaultValueString = (parameterDefaultValue: string) => ` = ${parameterDefaultValue}`;

const oDataExpressionBlockStr = (oDataExpression: string) => `
  $oDataQuery = ""
    ${oDataExpression}
    $oDataQuery = $oDataQuery.Trim("&")
`;

const helpDescStr = (synopsis: string, description: string) => ` 
.SYNOPSIS
    ${synopsis}

.DESCRIPTION
    ${description}
`;

const pathFunctionBodyHelper = (topPagingObjectStr: string, skipPagingObjectStr: string, pageResultPagingObjectStr: string, pageTypePagingObjectStr: string): string => {
  let result = "";
  if (topPagingObjectStr) {
    result += `
            $TopInfo = ${topPagingObjectStr}
            $GetTaskResult_params['TopInfo'] = $TopInfo`;
  }
  if (skipPagingObjectStr) {
    result += `
            $SkipInfo = ${skipPagingObjectStr}
            $GetTaskResult_params['SkipInfo'] = $SkipInfo`;
  }
  if (pageResultPagingObjectStr) {
    result += `
            $PageResult = ${pageResultPagingObjectStr}
            $GetTaskResult_params['PageResult'] = $PageResult`;
  }
  if (pageTypePagingObjectStr) {
    result += `
            $GetTaskResult_params['PageType'] = ${pageTypePagingObjectStr}`;
  }
  return result;
};

const pathFunctionBodyAsJob = (pagingBlock: string, topPagingObjectStr: string, skipPagingObjectStr: string, pageResultPagingObjectStr: string, pageTypePagingObjectStr: string) => `
Write-Verbose -Message "Waiting for the operation to complete."

    $PSSwaggerJobScriptBlock = {
        [CmdletBinding()]
        param(    
            [Parameter(Mandatory = $true)]
            [System.Threading.Tasks.Task]
            $TaskResult,

            [Parameter(Mandatory = $true)]
			[string]
			$TaskHelperFilePath
        )
        if ($TaskResult) {
            . $TaskHelperFilePath
            $GetTaskResult_params = @{
                TaskResult = $TaskResult
            }
${pathFunctionBodyHelper(topPagingObjectStr, skipPagingObjectStr, pageResultPagingObjectStr, pageTypePagingObjectStr)}            
            Get-TaskResult @GetTaskResult_params
            ${pagingBlock || ""}
        }
    }

    $PSCommonParameters = Get-PSCommonParameter -CallerPSBoundParameters $PSBoundParameters
    $TaskHelperFilePath = Join-Path -Path $ExecutionContext.SessionState.Module.ModuleBase -ChildPath 'Get-TaskResult.ps1'
    if($AsJob)
    {
        $ScriptBlockParameters = New-Object -TypeName 'System.Collections.Generic.Dictionary[string,object]'
        $ScriptBlockParameters['TaskResult'] = $TaskResult
        $ScriptBlockParameters['AsJob'] = $AsJob
        $ScriptBlockParameters['TaskHelperFilePath'] = $TaskHelperFilePath
        $PSCommonParameters.GetEnumerator() | ForEach-Object { $ScriptBlockParameters[$_.Name] = $_.Value }

        Start-PSSwaggerJobHelper -ScriptBlock $PSSwaggerJobScriptBlock \`
                                     -CallerPSBoundParameters $ScriptBlockParameters \`
                                     -CallerPSCmdlet $PSCmdlet \`
                                     @PSCommonParameters
    }
    else
    {
        Invoke-Command -ScriptBlock $PSSwaggerJobScriptBlock \`
                       -ArgumentList $TaskResult,$TaskHelperFilePath \`
                       @PSCommonParameters
    }
`;

const pathFunctionBodySynch = (pagingBlock: string, topPagingObjectStr: string, skipPagingObjectStr: string, pageResultPagingObjectStr: string, pageTypePagingObjectStr: string) => `
if ($TaskResult) {
        $GetTaskResult_params = @{
            TaskResult = $TaskResult
        }
${pathFunctionBodyHelper(topPagingObjectStr, skipPagingObjectStr, pageResultPagingObjectStr, pageTypePagingObjectStr)}
        Get-TaskResult @GetTaskResult_params
        ${pagingBlock || ""}
    }
`;

const advFnSignatureForPath = (
  commandName: string,
  commandHelp: string,
  paramHelp: string,
  outputTypeBlock: string,
  paramBlockReplaceStr: string,
  dependencyInitFunction: string,
  body: string,
  pathFunctionBody: string,
  defaultParameterSetName: string
) => `
<#
${commandHelp}
${paramHelp}
#>
function ${commandName} {
    ${outputTypeBlock || ""}[CmdletBinding(DefaultParameterSetName='${defaultParameterSetName}')]
    param(${paramBlockReplaceStr}
    )

    Begin {
	    ${dependencyInitFunction}
        $tracerObject = $null
        if (('continue' -eq $DebugPreference) -or ('inquire' -eq $DebugPreference)) {
            $oldDebugPreference = $global:DebugPreference
			      $global:DebugPreference = "continue"
            $tracerObject = New-PSSwaggerClientTracing
            Register-PSSwaggerClientTracing -TracerObject $tracerObject
        }
	}

    Process {
    ${body}

    ${pathFunctionBody}
    }

    End {
        if ($tracerObject) {
            $global:DebugPreference = $oldDebugPreference
            Unregister-PSSwaggerClientTracing -TracerObject $tracerObject
        }
    }
}
`;

const pagingOperationCallFunction = (clientName: string, pagingOperations: string, pagingOperationName: string, nextLinkName: string) => `
$TaskResult = ${clientName}${pagingOperations}.${pagingOperationName}($PageResult.Result.'${nextLinkName}')
            $GetTaskResult_params['TaskResult'] = $TaskResult
            $GetTaskResult_params['PageResult'] = $PageResult
            Get-TaskResult @GetTaskResult_params
`;

const pagingOperationCallCmdlet = (cmdlet: string, cmdletArgs: string) => `
${cmdlet} ${cmdletArgs}
`;

const pagingBlockStrGeneric = (pagingOperationCall: string, nextLinkName: string) => `
    
        Write-Verbose -Message 'Flattening paged results.'
        while ($PageResult -and $PageResult.Result -and (Get-Member -InputObject $PageResult.Result -Name '${nextLinkName}') -and $PageResult.Result.'${nextLinkName}' -and (($TopInfo -eq $null) -or ($TopInfo.Max -eq -1) -or ($TopInfo.Count -lt $TopInfo.Max))) {
            $PageResult.Result = $null
            Write-Debug -Message "Retrieving next page: $($PageResult.Result.'${nextLinkName}')"
            ${pagingOperationCall}
        }
`;

const pageTypeObjectBlock = (pageType: string) => `
'${pageType}' -as [Type]
`;

const filterBlockStrHelper = (clientSideFilter: any): string => {
  let result = "";
  let prependComma = false;
  for (const filter of clientSideFilter.Filters || clientSideFilter.filters) {
    if (prependComma) {
      result += ", "
    } else {
      prependComma = true;
    }
    result += `@{
    'Type' = '${filter.Type || filter.type}'
    'Value' = $${filter.Parameter || filter.parameter}
    'Property' = '${filter.Property || filter.property}'
`;
    for (const property of filter.NoteProperty || []) {
      if ((property.Name === 'Type') || (property.Name === 'Parameter') || (property.Name === 'Property') || (property.Name === 'AppendParameterInfo')) {
        continue;
      }
      result += `
    '${property.Name}' = '${filter[property.Name]}'`;
    }
    result += "}";
  }
  return result;
};

const filterBlockStr = (commandName: string, clientSideFilter: any, matchingParameters: string[]) => `
$filterInfos = @(
${filterBlockStrHelper(clientSideFilter)})
$applicableFilters = Get-ApplicableFilters -Filters $filterInfos
if ($applicableFilters | Where-Object { $_.Strict }) {
    Write-Verbose -Message 'Performing server-side call ''${(clientSideFilter.ServerSideResultCommand === '.' ? commandName : clientSideFilter.ServerSideResultCommand)} -${matchingParameters.join(" -")}'''
    $serverSideCall_params = @{
${matchingParameters.map(matchingParam => `       '${matchingParam}' = $${matchingParam}\r\n`).join(``)}
}

$serverSideResults =${(clientSideFilter.ServerSideResultCommand === '.' ? commandName : clientSideFilter.ServerSideResultCommand)} @serverSideCall_params
foreach($serverSideResult in $serverSideResults) {
    $valid = $true
    foreach($applicableFilter in $applicableFilters) {
        if (-not(Test - FilteredResult - Result$serverSideResult -Filter $applicableFilter.Filter)) {
            $valid = $false
            break
        }
    }

    if ($valid) {
        $serverSideResult
    }
}
return
}
`;

const failCase = (responseStatusValue: string, failureDescription: string) => `
                    {$responseStatusCode} {
                        ${responseStatusValue} {${failureDescription}}
                    }
`;

const successReturn = `
Write-Verbose "Operation completed with return code: \`$responseStatusCode."
                        $result = $TaskResult.Result.Body
                        Write-Verbose -Message "$($result | Out-String)"
                        $result
`;

const responseBodySwitchCase = (failWithDesc: string) => `
switch ($responseStatusCode)
                {
                    {200..299 -contains $responseStatusCode} {
                        ${successReturn}
                    }${failWithDesc}
                    
                    Default {Write-Error -Message "Status: $responseStatusCode received."}
                }
`;



const methodBlockFunctionCall = (clientName: string, operations: string, methodName: string, paramList: string) => `
        Write-Verbose -Message 'Performing operation ${methodName} on ${clientName}.'
        $TaskResult = ${clientName}${operations}.${methodName}(${paramList})
`;

const methodBlockCmdletCall = (cmdlet: string, cmdletArgs: string) => `
        Write-Verbose -Message 'Calling cmdlet ${cmdlet}.'
        ${cmdlet} ${cmdletArgs}
        $TaskResult = $null
`;



const parameterSetBasedMethodStrIfCase = (parameterSetConditionsStr: string, additionalConditionStart: string, methodBlock: string, additionalConditionEnd: string) => `
if (${parameterSetConditionsStr}) {
${additionalConditionStart}${methodBlock}${additionalConditionEnd}
    }
`;

const parameterSetBasedMethodStrElseIfCase = (parameterSetConditionsStr: string, additionalConditionStart: string, methodBlock: string, additionalConditionEnd: string) => `
 elseif (${parameterSetConditionsStr}) {
${additionalConditionStart}${methodBlock}${additionalConditionEnd}
    }
`;


const constructFlattenedParameter = (flattenedParametersListStr: string, flattenedParamType: string, swaggerOperationParameterName: string) => `
    $flattenedParameters = ${flattenedParametersListStr}
    $utilityCmdParams = @{}
    $flattenedParameters | ForEach-Object {
        if($PSBoundParameters.ContainsKey($_)) {
            $utilityCmdParams[$_] = $PSBoundParameters[$_]
        }
    }
    $${swaggerOperationParameterName} = New-${flattenedParamType}Object @utilityCmdParams
`;

const asJobParameterString = `

        [Parameter(Mandatory = $false)]
        [switch]
        $AsJob
`;