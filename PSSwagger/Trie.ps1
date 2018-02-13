#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################
function New-Trie {
    return @{}
}

function Add-WordToTrie {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Word,
        [Parameter(Mandatory=$true)]
        [hashtable]$Trie
    )

    $Word = $Word.ToLower()

    $Trie[$Word] = $true

    return $Trie
}

function Test-Trie {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Word,
        [Parameter(Mandatory=$true,ValueFromPipeline)]
        [hashtable]$Trie
    )

    $Word = $Word.ToLower()

    return $Trie.ContainsKey($Word)
}