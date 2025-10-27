// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, euint64, euint256, externalEuint8, externalEuint32, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ZenChainDiary - Encrypted Mental Health Diary
/// @author ZenChain Team
/// @notice A privacy-preserving mental health diary using FHEVM
/// @dev Stores encrypted mood/stress/sleep scores and tags on-chain
contract ZenChainDiary is SepoliaConfig {
    //////////////////////////////////////////////////////////////////////////////
    // STRUCTS
    //////////////////////////////////////////////////////////////////////////////

    /// @notice User profile with encrypted statistics
    struct UserProfile {
        bool registered;                // Whether user has registered
        uint256 registeredAt;          // Registration timestamp
        euint32 totalEntries;          // Total number of diary entries (encrypted)
        euint64 sumMood;               // Cumulative mood score (encrypted)
        euint64 sumStress;             // Cumulative stress score (encrypted)
        euint64 sumSleep;              // Cumulative sleep quality (encrypted)
        bool allowPublic;              // Whether to participate in global stats
    }

    /// @notice Single diary entry
    struct DiaryEntry {
        uint256 id;                    // Entry ID
        address author;                // Entry author
        euint8 moodScore;              // Mood score 1-10 (encrypted)
        euint8 stressScore;            // Stress score 1-10 (encrypted)
        euint8 sleepQuality;           // Sleep quality 1-10 (encrypted)
        euint32 moodTags;              // Mood tags bitmask (encrypted)
        euint256 diaryTextHash;        // Encrypted hash/summary of diary text (first 32 bytes)
        uint256 timestamp;             // Timestamp (plaintext for sorting)
        bool isPublic;                 // Whether to include in global stats
        bool isDeleted;                // Soft delete flag
    }

    //////////////////////////////////////////////////////////////////////////////
    // STATE VARIABLES
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Mapping from user address to profile
    mapping(address => UserProfile) public profiles;

    /// @notice Mapping from entry ID to entry
    mapping(uint256 => DiaryEntry) public entries;

    /// @notice Mapping from user address to array of entry IDs
    mapping(address => uint256[]) private userEntryIds;

    /// @notice Global entry counter
    uint256 public totalEntryCount;

    /// @notice Array of public entry IDs (for global stats)
    uint256[] public publicEntryIds;

    //////////////////////////////////////////////////////////////////////////////
    // EVENTS
    //////////////////////////////////////////////////////////////////////////////

    event EntrySubmitted(
        address indexed user,
        uint256 indexed entryId,
        uint256 timestamp,
        bool isPublic
    );

    event EntryDeleted(
        address indexed user,
        uint256 indexed entryId
    );

    event PrivacySettingUpdated(
        address indexed user,
        bool allowPublic
    );

    event UserRegistered(
        address indexed user,
        uint256 timestamp
    );

    //////////////////////////////////////////////////////////////////////////////
    // ERRORS
    //////////////////////////////////////////////////////////////////////////////

    error Unauthorized();
    error EntryNotFound();
    error InvalidScore(); // For scores that should be 1-10

    //////////////////////////////////////////////////////////////////////////////
    // MODIFIERS
    //////////////////////////////////////////////////////////////////////////////

    modifier onlyAuthor(uint256 entryId) {
        if (entries[entryId].author != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    modifier entryExists(uint256 entryId) {
        if (entries[entryId].author == address(0)) {
            revert EntryNotFound();
        }
        _;
    }

    //////////////////////////////////////////////////////////////////////////////
    // PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Submit a new diary entry
    /// @param encryptedMood Encrypted mood score (1-10)
    /// @param encryptedStress Encrypted stress score (1-10)
    /// @param encryptedSleep Encrypted sleep quality (1-10)
    /// @param encryptedTags Encrypted mood tags (bitmask)
    /// @param encryptedTextHash Encrypted text hash/summary
    /// @param isPublic Whether to participate in global stats
    /// @return entryId The ID of the created entry
    function submitEntry(
        externalEuint8 encryptedMood,
        bytes calldata moodProof,
        externalEuint8 encryptedStress,
        bytes calldata stressProof,
        externalEuint8 encryptedSleep,
        bytes calldata sleepProof,
        externalEuint32 encryptedTags,
        bytes calldata tagsProof,
        externalEuint256 encryptedTextHash,
        bytes calldata textProof,
        bool isPublic
    ) external returns (uint256 entryId) {
        // Register user if first time
        if (!profiles[msg.sender].registered) {
            _registerUser();
        }

        // Convert external inputs to encrypted types
        euint8 mood = FHE.fromExternal(encryptedMood, moodProof);
        euint8 stress = FHE.fromExternal(encryptedStress, stressProof);
        euint8 sleep = FHE.fromExternal(encryptedSleep, sleepProof);
        euint32 tags = FHE.fromExternal(encryptedTags, tagsProof);
        euint256 textHash = FHE.fromExternal(encryptedTextHash, textProof);

        // Create entry
        entryId = totalEntryCount++;
        entries[entryId] = DiaryEntry({
            id: entryId,
            author: msg.sender,
            moodScore: mood,
            stressScore: stress,
            sleepQuality: sleep,
            moodTags: tags,
            diaryTextHash: textHash,
            timestamp: block.timestamp,
            isPublic: isPublic,
            isDeleted: false
        });

        // Grant access to author for the stored values
        FHE.allow(entries[entryId].moodScore, msg.sender);
        FHE.allow(entries[entryId].stressScore, msg.sender);
        FHE.allow(entries[entryId].sleepQuality, msg.sender);
        FHE.allow(entries[entryId].moodTags, msg.sender);
        FHE.allow(entries[entryId].diaryTextHash, msg.sender);

        // Allow contract to access for aggregation and getters
        FHE.allowThis(entries[entryId].moodScore);
        FHE.allowThis(entries[entryId].stressScore);
        FHE.allowThis(entries[entryId].sleepQuality);
        FHE.allowThis(entries[entryId].moodTags);
        FHE.allowThis(entries[entryId].diaryTextHash);

        // Update user profile
        UserProfile storage profile = profiles[msg.sender];
        
        // Allow contract to access existing encrypted values before operations
        FHE.allowThis(profile.totalEntries);
        FHE.allowThis(profile.sumMood);
        FHE.allowThis(profile.sumStress);
        FHE.allowThis(profile.sumSleep);
        
        // Update encrypted statistics
        profile.totalEntries = FHE.add(profile.totalEntries, FHE.asEuint32(1));
        profile.sumMood = FHE.add(profile.sumMood, FHE.asEuint64(mood));
        profile.sumStress = FHE.add(profile.sumStress, FHE.asEuint64(stress));
        profile.sumSleep = FHE.add(profile.sumSleep, FHE.asEuint64(sleep));

        // Allow contract and user to access updated values
        FHE.allowThis(profile.totalEntries);
        FHE.allowThis(profile.sumMood);
        FHE.allowThis(profile.sumStress);
        FHE.allowThis(profile.sumSleep);
        
        FHE.allow(profile.totalEntries, msg.sender);
        FHE.allow(profile.sumMood, msg.sender);
        FHE.allow(profile.sumStress, msg.sender);
        FHE.allow(profile.sumSleep, msg.sender);

        // Add to user's entry list
        userEntryIds[msg.sender].push(entryId);

        // Add to public list if opted in
        if (isPublic && profile.allowPublic) {
            publicEntryIds.push(entryId);
        }

        emit EntrySubmitted(msg.sender, entryId, block.timestamp, isPublic);
    }

    /// @notice Get user's entry IDs with pagination
    /// @param user User address
    /// @param offset Starting index
    /// @param limit Maximum number of entries to return
    /// @return entryIds Array of entry IDs
    function getUserEntries(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory entryIds) {
        uint256[] storage allIds = userEntryIds[user];
        uint256 total = allIds.length;

        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 count = end - offset;
        entryIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            entryIds[i] = allIds[total - 1 - (offset + i)]; // Reverse order (newest first)
        }
    }

    /// @notice Get total number of user entries
    /// @param user User address
    /// @return count Total entry count
    function getUserEntryCount(address user) external view returns (uint256 count) {
        return userEntryIds[user].length;
    }

    /// @notice Get a diary entry (read-only, returns encrypted handles)
    /// @param entryId Entry ID
    /// @return entry The diary entry
    function getEntry(uint256 entryId) 
        external 
        view 
        entryExists(entryId) 
        returns (DiaryEntry memory entry) 
    {
        return entries[entryId];
    }

    /// @notice Get encrypted mood score for an entry (workaround for Mock env struct field limitation)
    /// @param entryId Entry ID
    /// @return Encrypted mood score
    function getEntryMoodScore(uint256 entryId)
        external
        view
        entryExists(entryId)
        returns (euint8)
    {
        return entries[entryId].moodScore;
    }

    /// @notice Get encrypted stress score for an entry
    /// @param entryId Entry ID
    /// @return Encrypted stress score
    function getEntryStressScore(uint256 entryId)
        external
        view
        entryExists(entryId)
        returns (euint8)
    {
        return entries[entryId].stressScore;
    }

    /// @notice Get encrypted sleep quality for an entry
    /// @param entryId Entry ID
    /// @return Encrypted sleep quality
    function getEntrySleepQuality(uint256 entryId)
        external
        view
        entryExists(entryId)
        returns (euint8)
    {
        return entries[entryId].sleepQuality;
    }

    /// @notice Get encrypted mood tags for an entry
    /// @param entryId Entry ID
    /// @return Encrypted mood tags
    function getEntryMoodTags(uint256 entryId)
        external
        view
        entryExists(entryId)
        returns (euint32)
    {
        return entries[entryId].moodTags;
    }

    /// @notice Get encrypted diary text hash for an entry
    /// @param entryId Entry ID
    /// @return Encrypted diary text hash
    function getEntryTextHash(uint256 entryId)
        external
        view
        entryExists(entryId)
        returns (euint256)
    {
        return entries[entryId].diaryTextHash;
    }

    /// @notice Soft delete an entry (marks as deleted, doesn't remove from chain)
    /// @param entryId Entry ID to delete
    function deleteEntry(uint256 entryId) 
        external 
        onlyAuthor(entryId) 
        entryExists(entryId) 
    {
        entries[entryId].isDeleted = true;
        emit EntryDeleted(msg.sender, entryId);
    }

    /// @notice Update privacy setting for participating in global stats
    /// @param allowPublic New privacy setting
    function updatePrivacySetting(bool allowPublic) external {
        if (!profiles[msg.sender].registered) {
            _registerUser();
        }
        profiles[msg.sender].allowPublic = allowPublic;
        emit PrivacySettingUpdated(msg.sender, allowPublic);
    }

    /// @notice Get user profile
    /// @param user User address
    /// @return profile User profile
    function getUserProfile(address user) external view returns (UserProfile memory profile) {
        return profiles[user];
    }

    /// @notice Get total number of public entries
    /// @return count Public entry count
    function getPublicEntryCount() external view returns (uint256 count) {
        return publicEntryIds.length;
    }

    //////////////////////////////////////////////////////////////////////////////
    // INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Register a new user
    function _registerUser() internal {
        profiles[msg.sender] = UserProfile({
            registered: true,
            registeredAt: block.timestamp,
            totalEntries: FHE.asEuint32(0),
            sumMood: FHE.asEuint64(0),
            sumStress: FHE.asEuint64(0),
            sumSleep: FHE.asEuint64(0),
            allowPublic: true // Default opt-in
        });

        // Allow user to access their encrypted stats
        FHE.allow(profiles[msg.sender].totalEntries, msg.sender);
        FHE.allow(profiles[msg.sender].sumMood, msg.sender);
        FHE.allow(profiles[msg.sender].sumStress, msg.sender);
        FHE.allow(profiles[msg.sender].sumSleep, msg.sender);

        emit UserRegistered(msg.sender, block.timestamp);
    }
}

