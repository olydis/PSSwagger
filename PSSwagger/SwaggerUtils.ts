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

function getPsTypeFromSwaggerObject(parameterType: string, jsonObject: any): string {
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


// function getAzureResourceIdParameters(
//   jsonPathItemObject: any,
//   resourceId: string,
//   namespace: string,
//   models: string,
//   definitionList: any
// ): any {
//   const getPathItemObject = jsonPathItemObject[Object.keys(jsonPathItemObject).filter(x => x.toLowerCase() === "get")[0]];
//   if (!getPathItemObject) {
//     logDebug(`Get operation not available in ${resourceId}.`);
//     return;
//   }

//   const tokens = resourceId.split('/').filter(x => x !== "");
//   if (tokens.length < 8) {
//     logDebug(`The specified endpoint '${resourceId}' is not a valid resource identifier.`);
//     return;
//   }
//   const resourceIdParameters = tokens
//     .filter(t => t.startsWith('{') && t.endsWith('}'))
//     .map(t => t.slice(1, -1))
//     .filter(t => t.toLowerCase() !== "subscriptionid");
//   if (tokens[tokens.length - 1] !== `{${resourceIdParameters[resourceIdParameters.length - 1]}}`) {
//     return;
//   }

//   const responses = getPathItemObject.responses;
//   if (!responses) {
//     return;
//   }

//   const getResponseParams = { responses, namespace, models, definitionList };

// }

// function getResponse(responses: any, namespace: string, models: string, definitionList: any): any {
//   let outputTypeFlag = false;
//   let responseBody = "";
//   let outputType: ???= null;
//   let outputTypeBlock: ???= null;
//   let failWithDesc = "";

//   for (const key of Object.keys(responses).map(x => +x)) {
//     const responseStatusValue = `'${key}'`;
//     const value = responses[key];

//     // handle success
//     if (200 <= key && key < 300) {
//       if (!outputTypeFlag && value.schema) {
//         // Add the [OutputType] for the function

//       }
//     }
//   }

//   $responses | ForEach - Object {

//     switch ($_.Name) {
//       # Handle Success
//     { 200..299 - contains $_ } {
//       if (-not $outputTypeFlag - and(Get - member - inputobject $value - name "schema"))
//       {
//         # Add the[OutputType] for the function
//                     $OutputTypeParams = @{
//             "schema"  = $value.schema
//                         "ModelsNamespace" = "$NameSpace.$Models"
//                         "definitionList" = $definitionList
//           }

//         $outputTypeResult = Get - OutputType @OutputTypeParams
//         $outputTypeBlock = $outputTypeResult.OutputTypeBlock
//         $outputType = $outputTypeResult.OutputType
//         $outputTypeFlag = $true
//       }
//     }
//     # Handle Client Error
//     { 400..499 - contains $_ } {
//       if ($Value.description) {
//         $failureDescription = "Write-Error 'CLIENT ERROR: " + $value.description + "'"
//         $failWithDesc += $executionContext.InvokeCommand.ExpandString($failCase)
//       }
//     }
//     # Handle Server Error
//     { 500..599 - contains $_ } {
//       if ($Value.description) {
//         $failureDescription = "Write-Error 'SERVER ERROR: " + $value.description + "'"
//         $failWithDesc += $executionContext.InvokeCommand.ExpandString($failCase)
//       }
//     }
//   }
// }

// $responseBody += $executionContext.InvokeCommand.ExpandString($responseBodySwitchCase)

// return @{
//   ResponseBody    = $responseBody
//         OutputType      = $OutputType
//         OutputTypeBlock = $OutputTypeBlock
// }
// }



function getPathFunctionBody(
  ParameterSetDetails: any,
  ODataExpressionBlock: string,
  ParameterGroupsExpressionBlock: string,
  GlobalParameters: string[],
  SwaggerDict: any,
  SwaggerMetaDict: any,
  AddHttpClientHandler: boolean,
  HostOverrideCommand: string,
  AuthenticationCommand: string,
  AuthenticationCommandArgumentName: string,
  FlattenedParametersOnPSCmdlet: any,
  ParameterAliasMapping: any,
  GlobalParametersStatic: any,
  FilterBlock: string
): any {

}


function doParameterStuff(
  commandName: string,
  parametersToAdd: any[],
  nonUniqueParameterSets: any[],
  parameterSetDetails: any[],
  isLongRunningOperation: boolean,
  asJobParameterString: string,
  pagingBlock: string,
  pagingOperations: string | null,
  nextLinkName: string,
  pageType: string,
  topParameterToAdd: any,
  skipParameterToAdd: any,
  clientName: string,
  pagingOperationName: string,
  cmdlet: string,
  cmdletArgs: string): any {

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

  return {
    paramHelp,
    parameterGroupsExpressionBlock,
    oDataExpressionBlock,
    parameterAliasMapping,
    defaultParameterSetName,
    commandHelp,
    paramBlockReplaceStr,
    pathFunctionBody
  };
}


// TEMPLATE
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
  if (topPagingObjectStr) {
    return `
            $TopInfo = ${topPagingObjectStr}
            $GetTaskResult_params['TopInfo'] = $TopInfo`;
  }
  if (skipPagingObjectStr) {
    return `
            $SkipInfo = ${skipPagingObjectStr}
            $GetTaskResult_params['SkipInfo'] = $SkipInfo`;
  }
  if (pageResultPagingObjectStr) {
    return `
            $PageResult = ${pageResultPagingObjectStr}
            $GetTaskResult_params['PageResult'] = $PageResult`;
  }
  if (pageTypePagingObjectStr) {
    return `
            $GetTaskResult_params['PageType'] = ${pageTypePagingObjectStr}`;
  }
  return "";
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
  for (const filter of clientSideFilter.Filters) {
    if (prependComma) {
      result += ", "
    } else {
      prependComma = true;
    }
    result += `@{
    'Type' = '${filter.Type}'
    'Value' = $${filter.Parameter}
    'Property' = '${filter.Property}'
`;
    for (const property of filter.NoteProperty) {
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