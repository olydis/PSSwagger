
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

function logVerbose(message: string) { }

function getPathCommandName(operationId: string): any {
  const opIdValues = operationId.split("_", 2);

  // OperationId can be specified without '_' (Underscore), Verb will retrieved by the below logic for non-approved verbs.
  let cmdNoun = opIdValues.length === 2 ? getSingularizedValue(opIdValues[0]) : "";
  let cmdVerb = opIdValues.length === 2 ? opIdValues[1] : getSingularizedValue(operationId);
  let cmdVerbs: string[] = [cmdVerb];

  if (!(cmdVerb in cmdVerbMap_GetVerb)) {
    const unapprovedVerb = cmdVerb;
    logVerbose(`Verb '${unapprovedVerb}' not an approved verb.`);

    if (ExistsVerb(cmdVerb)) {
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

        // If we're still running along the trie just fine, keep checking the next letter
        currentVerbCandidate += unapprovedVerb.charAt(i);
        if (ExistsVerb(currentVerbCandidate)) {
          // The latest verb match is also the longest verb match
          longestVerbMatch = currentVerbCandidate;
          verbMatchEnd = i + 1;
        }
      }

      const beginningOfSuffix = longestVerbMatch ? verbMatchEnd : firstWordEnd;
      cmdVerb = longestVerbMatch ? longestVerbMatch : firstWord;

      if (ExistsVerb(cmdVerb)) {
        cmdVerbs = MapVerb(cmdVerb);
      } else {
        cmdVerbs = [cmdVerb];
      }

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
          else if (cmdNounSuffix.includes(cmdNoun)) {
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