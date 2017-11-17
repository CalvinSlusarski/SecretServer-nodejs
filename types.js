/**
 * @typedef {Object} WebServiceResult
 * @property {string[]} Errors
 */

/**
 * @typedef {Object} DownloadFileAttachmentByItemIdResult
 * @extends WebServiceResult
 * @property {string} FileAttachment - file contents in base64Binary
 * @property {string} FileName
 */

/**
 * @typedef {Object} GetSecretResult
 * @property {string[]} Errors
 * @property {SecretError} SecretError
 * @property {Secret} Secret
 */

/**
 * @typedef {Object} Secret
 * @property {string} Name
 * @property {Object.<string, SecretItem>} Items
 * @property {number} Id
 * @property {number} SecretTypeId
 * @property {number} FolderId
 * @property {boolean} IsWebLauncher
 * @property {?number} CheckOutMinutesRemaining
 * @property {?boolean} IsCheckedOut
 * @property {string} CheckOutUserDisplayName
 * @property {number} CheckOutUserId
 * @property {?boolean} IsOutOfSync
 * @property {?boolean} IsRestricted
 * @property {string} OutOfSyncReason
 * @property {SecretSettings} SecretSettings
 * @property {SecretPermissions} SecretPermissions
 * @property {?boolean} Active
 */

/**
 * @typedef {Object} SecretItem
 * @property {number} Id
 * @property {number} FieldId
 * @property {string} FieldName
 * @property {boolean} IsFile
 * @property {boolean} IsNotes
 * @property {boolean} IsPassword
 * @property {string} FieldDisplayName
 * @property {?DownloadFileAttachmentByItemIdResult} Value
 */

/**
 * @typedef {Object} SecretSettings
 * @property {?boolean} AutoChangeEnabled
 * @property {?boolean} RequiresApprovalForAccess
 * @property {?boolean} RequiresComment
 * @property {?boolean} CheckOutEnabled
 * @property {?boolean} CheckOutChangePasswordEnabled
 * @property {?boolean} ProxyEnabled
 * @property {?boolean} SessionRecordingEnabled
 * @property {?boolean} RestrictSshCommands
 * @property {?boolean} AllowOwnersUnrestrictedSshCommands
 * @property {?number} PrivilegedSecretId
 * @property {?number[]} AssociatedSecretIds
 * @property {GroupOrUserRecord[]} Approvers
 * @property {SshCommandMenuAccessPermission[]} SshCommandMenuAccessPermissions
 * @property {boolean} IsChangeToSettings
 */

/**
 * @typedef {Object} GroupOrUserRecord
 * @property {string} Name
 * @property {string} DomainName
 * @property {bool} IsUser
 * @property {?number} GroupId
 * @property {?number} UserId
 */

/**
 * @typedef {Object} SshCommandMenuAccessPermission
 * @property {GroupOrUserRecord} GroupOrUserRecord
 * @property {number} SecretId
 * @property {string} ConcurrencyId
 * @property {string} DisplayName
 * @property {string} SshCommandMenuName
 * @property {boolean} IsUnrestricted
 * @property {?number} SshCommandMenuId
 */

/**
 * @typedef {Object} SecretPermissions
 * @property {boolean} CurrentUserHasView
 * @property {boolean} CurrentUserHasEdit
 * @property {boolean} CurrentUserHasOwner
 * @property {?boolean} InheritPermissionsEnabled
 * @property {boolean} IsChangeToPermissions
 * @property {Permission[]} Permissions
 */

/**
 * @typedef {Object} Permission
 * @property {UserOrGroup} UserOrGroup
 * @property {boolean} View
 * @property {boolean} Edit
 * @property {boolean} Owner
 * @property {string} SecretAccessRoleName
 * @property {?number} SecretAccessRoleId
 */

/**
 * @typedef {Object} SecretError
 * @property {string} ErrorCode
 * @property {string} ErrorMessage
 * @property {boolean} AllowsResponse
 * @property {string} CommentTitle
 * @property {string} AdditionalCommentTitle
 */