
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ZenChainDiaryABI = {
  "abi": [
    {
      "inputs": [],
      "name": "EntryNotFound",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidScore",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "Unauthorized",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "EntryDeleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isPublic",
          "type": "bool"
        }
      ],
      "name": "EntrySubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "allowPublic",
          "type": "bool"
        }
      ],
      "name": "PrivacySettingUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "UserRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "deleteEntry",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "entries",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "author",
          "type": "address"
        },
        {
          "internalType": "euint8",
          "name": "moodScore",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "stressScore",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "sleepQuality",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "moodTags",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "diaryTextHash",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isPublic",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isDeleted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntry",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "author",
              "type": "address"
            },
            {
              "internalType": "euint8",
              "name": "moodScore",
              "type": "bytes32"
            },
            {
              "internalType": "euint8",
              "name": "stressScore",
              "type": "bytes32"
            },
            {
              "internalType": "euint8",
              "name": "sleepQuality",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "moodTags",
              "type": "bytes32"
            },
            {
              "internalType": "euint256",
              "name": "diaryTextHash",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isPublic",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isDeleted",
              "type": "bool"
            }
          ],
          "internalType": "struct ZenChainDiary.DiaryEntry",
          "name": "entry",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntryMoodScore",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntryMoodTags",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntrySleepQuality",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntryStressScore",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "name": "getEntryTextHash",
      "outputs": [
        {
          "internalType": "euint256",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPublicEntryCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "offset",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "limit",
          "type": "uint256"
        }
      ],
      "name": "getUserEntries",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "entryIds",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserEntryCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserProfile",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "registered",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "registeredAt",
              "type": "uint256"
            },
            {
              "internalType": "euint32",
              "name": "totalEntries",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "sumMood",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "sumStress",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "sumSleep",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "allowPublic",
              "type": "bool"
            }
          ],
          "internalType": "struct ZenChainDiary.UserProfile",
          "name": "profile",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "profiles",
      "outputs": [
        {
          "internalType": "bool",
          "name": "registered",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "registeredAt",
          "type": "uint256"
        },
        {
          "internalType": "euint32",
          "name": "totalEntries",
          "type": "bytes32"
        },
        {
          "internalType": "euint64",
          "name": "sumMood",
          "type": "bytes32"
        },
        {
          "internalType": "euint64",
          "name": "sumStress",
          "type": "bytes32"
        },
        {
          "internalType": "euint64",
          "name": "sumSleep",
          "type": "bytes32"
        },
        {
          "internalType": "bool",
          "name": "allowPublic",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "publicEntryIds",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint8",
          "name": "encryptedMood",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "moodProof",
          "type": "bytes"
        },
        {
          "internalType": "externalEuint8",
          "name": "encryptedStress",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "stressProof",
          "type": "bytes"
        },
        {
          "internalType": "externalEuint8",
          "name": "encryptedSleep",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "sleepProof",
          "type": "bytes"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedTags",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "tagsProof",
          "type": "bytes"
        },
        {
          "internalType": "externalEuint256",
          "name": "encryptedTextHash",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "textProof",
          "type": "bytes"
        },
        {
          "internalType": "bool",
          "name": "isPublic",
          "type": "bool"
        }
      ],
      "name": "submitEntry",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "entryId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalEntryCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "allowPublic",
          "type": "bool"
        }
      ],
      "name": "updatePrivacySetting",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
