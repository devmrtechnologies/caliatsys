/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// Angular modules
import {
    Injectable
} from '@angular/core';
import {
    Inject
} from '@angular/core';
import {
    Optional
} from '@angular/core';
import {
    EventEmitter
} from '@angular/core';
// External modules
import * as AWSCognito from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';
// Models
import {
    CognitoServiceResponse
} from './models/cognito-service-response.model';
// Enums
import {
    AuthType
} from './enums/auth-type.enum';
import {
    RespType
} from './enums/resp-type.enum';
import * as i0 from "@angular/core";
/** @enum {string} */
var GoogleAction = {
    AUTHENTICATE: 'authenticate',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
};
export {
    GoogleAction
};
var CognitoService = /** @class */ (function() {
    function CognitoService(cognitoConst) {
        this.cognitoConst = cognitoConst;
        this.poolData = {
            UserPoolId: null,
            // CognitoUserPool
            ClientId: null // CognitoUserPoolClient
        };
        this.onSignIn = new EventEmitter();
        this.onSignOut = new EventEmitter();
        this.storagePrefix = cognitoConst.storagePrefix + '_CognitoService_';
        this.googleId = cognitoConst.googleId;
        this.googleScope = cognitoConst.googleScope;
        this.poolData.UserPoolId = cognitoConst.poolData.UserPoolId;
        this.poolData.ClientId = cognitoConst.poolData.ClientId;
        this.identityPool = cognitoConst.identityPool;
        this.region = cognitoConst.region;
        this.adminAccessKeyId = cognitoConst.adminAccessKeyId;
        this.adminSecretKeyId = cognitoConst.adminSecretKeyId;
    }
    // -------------------------------------------------------------------------------------------
    // SECTION: Helpers --------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // NOTE: Misc --------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // SECTION: Helpers --------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // NOTE: Misc --------------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.isAuthenticated =
        // -------------------------------------------------------------------------------------------
        // SECTION: Helpers --------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        // NOTE: Misc --------------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            if (this.getRemaining())
                return true;
            return false;
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.sts =
        /**
         * @return {?}
         */
        function() {
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    /** @type {?} */
                    var sts = new AWS.STS();
                    /** @type {?} */
                    var params = null;
                    sts.getCallerIdentity(params, (
                        /**
                         * @param {?} err
                         * @param {?} data
                         * @return {?}
                         */
                        function(err, data) {
                            if (data)
                                return resolve(data);
                            console.error('CognitoService : sts -> getCallerIdentity', err);
                            return reject(err);
                        }));
                }));
        };
    // NOTE: Session -----------------------------------------------------------------------------
    // NOTE: Session -----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.autoRefreshSession =
        // NOTE: Session -----------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            var _this = this;
            /** @type {?} */
            var expiresAt = this.getExpiresAt();
            if (!expiresAt)
                return;
            /** @type {?} */
            var timeDiff = expiresAt.getTime() - Date.now() - 60000;
            if (timeDiff < 0) {
                this.signOut();
                return;
            }
            setTimeout((
                /**
                 * @return {?}
                 */
                function() {
                    // Refresh token
                    _this.refreshSession()
                        .then((
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            function(_) {
                                _this.autoRefreshSession();
                            }))
                        .catch((
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            function(_) {
                                _this.signOut();
                            }));
                }), timeDiff);
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getRemaining =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var remaining = 0;
            /** @type {?} */
            var now = 0;
            /** @type {?} */
            var max = null;
            now = Date.now();
            max = this.getExpiresAt();
            if (!max)
                return null;
            remaining = max.getTime() - now;
            if (remaining <= 0)
                return null;
            return remaining;
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getExpiresAt =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var expiresAtStr = null;
            /** @type {?} */
            var expiresAtNum = null;
            /** @type {?} */
            var expiresAtDat = null;
            storageKey = this.storagePrefix + 'ExpiresAt';
            expiresAtStr = localStorage.getItem(storageKey);
            if (expiresAtStr) {
                expiresAtNum = Number(expiresAtStr);
                if (expiresAtNum)
                    expiresAtDat = new Date(expiresAtNum);
            }
            return expiresAtDat;
        };
    // NOTE: Username ----------------------------------------------------------------------------
    // NOTE: Username ----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.getUsername =
        // NOTE: Username ----------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var provider = null;
            storageKey = this.storagePrefix + 'Username';
            provider = localStorage.getItem(storageKey);
            return provider;
        };
    // NOTE: Provider ----------------------------------------------------------------------------
    // NOTE: Provider ----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.getProvider =
        // NOTE: Provider ----------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var provider = null;
            storageKey = this.storagePrefix + 'Provider';
            provider = localStorage.getItem(storageKey);
            return provider;
        };
    // NOTE: Token -------------------------------------------------------------------------------
    // NOTE: Token -------------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.getIdToken =
        // NOTE: Token -------------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var idToken = null;
            storageKey = this.storagePrefix + 'IdToken';
            idToken = localStorage.getItem(storageKey);
            return idToken;
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getTokens =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var tokensStr = null;
            /** @type {?} */
            var tokensObj = null;
            storageKey = this.storagePrefix + 'SessionTokens';
            tokensStr = localStorage.getItem(storageKey);
            tokensObj = JSON.parse(tokensStr);
            return tokensObj;
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Credentials ----------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Credentials ----------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @return {?}
     */
    CognitoService.prototype.initCredentials =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Credentials ----------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * @return {?}
         */
        function() {
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: this.identityPool,
            });
            AWS.config.region = this.region;
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getCredentials =
        /**
         * @return {?}
         */
        function() {
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    /** @type {?} */
                    var credentials = ( /** @type {?} */ (AWS.config.credentials));
                    if (!credentials) {
                        /** @type {?} */
                        var error = 'You must initialize the credentials with initCredentials()';
                        console.error('CognitoService : getCredentials', error);
                        return reject(error);
                    }
                    credentials.get((
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        function(err) {
                            if (err) {
                                console.error('CognitoService : getCredentials', err);
                                return reject(err);
                            }
                            return resolve(AWS.config.credentials);
                        }));
                }));
        };
    /**
     * @param {?=} clientConfig
     * @return {?}
     */
    CognitoService.prototype.updateCredentials =
        /**
         * @param {?=} clientConfig
         * @return {?}
         */
        function(clientConfig) {
            /** @type {?} */
            var url = null;
            /** @type {?} */
            var provider = null;
            /** @type {?} */
            var idToken = null;
            provider = this.getProvider();
            idToken = this.getIdToken();
            switch (provider) {
                case AuthType.COGNITO:
                    url = 'cognito-idp.' + this.region.toLowerCase() + '.amazonaws.com/' + this.poolData.UserPoolId;
                    break;
                case AuthType.GOOGLE:
                    url = 'accounts.google.com';
                    break;
                default:
                    console.error('CognitoService : setCredentials -> Provider not recognized');
                    return;
            }
            /** @type {?} */
            var logins = {};
            logins[url] = idToken;
            if (!this.identityPool) {
                console.info('We recommend that you provide an identity pool ID from a federated identity');
                return;
            }
            /** @type {?} */
            var options = {
                IdentityPoolId: this.identityPool,
                Logins: logins
            };
            AWS.config.region = this.region;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials(options, clientConfig);
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: User -----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: User -----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @param {?=} username
     * @return {?}
     */
    CognitoService.prototype.getCognitoUser =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: User -----------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * @param {?=} username
         * @return {?}
         */
        function(username) {
            if (username === void 0) {
                username = null;
            }
            if (this.cognitoUser)
                return this.cognitoUser; // User stored in the service
            // User stored in the service
            /** @type {?} */
            var cognitoUser = null;
            /** @type {?} */
            var cognitoUserPool = new AWSCognito.CognitoUserPool(this.poolData);
            cognitoUser = cognitoUserPool.getCurrentUser(); // Authenticated user
            if (!cognitoUser) {
                /** @type {?} */
                var name_1 = null;
                if (username)
                    name_1 = username; // User sent
                else
                    name_1 = this.getUsername(); // User stored in local storage
                cognitoUser = this.setCognitoUser(name_1);
            }
            return cognitoUser;
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getUserAttributes =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            cognitoUser.getUserAttributes((
                /**
                 * @param {?} err
                 * @param {?} res
                 * @return {?}
                 */
                function(err, res) {
                    if (res)
                        return res;
                    console.error('CognitoService : getUserAttributes -> getUserAttributes', err);
                }));
        };
    /**
     * @param {?} attributeList
     * @return {?}
     */
    CognitoService.prototype.deleteAttributes =
        /**
         * @param {?} attributeList
         * @return {?}
         */
        function(attributeList) {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            cognitoUser.deleteAttributes(attributeList, (
                /**
                 * @param {?} err
                 * @param {?} res
                 * @return {?}
                 */
                function(err, res) {
                    if (res)
                        return res;
                    console.error('CognitoService : deleteAttributes -> deleteAttributes', err);
                }));
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.getUserData =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            cognitoUser.getUserData((
                /**
                 * @param {?} err
                 * @param {?} res
                 * @return {?}
                 */
                function(err, res) {
                    if (res)
                        return res;
                    console.error('CognitoService : getUserData -> getUserData', err);
                }));
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.deleteUser =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            cognitoUser.deleteUser((
                /**
                 * @param {?} err
                 * @param {?} res
                 * @return {?}
                 */
                function(err, res) {
                    if (res)
                        return res;
                    console.error('CognitoService : deleteUser -> deleteUser', err);
                }));
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Registration ---------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Register a new user
     *
     * @param username
     * @param password
     * @param userAttributes - Optional parameter
     * @param validationData - Optional parameter
     */
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Registration ---------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Register a new user
     *
     * @param {?} username
     * @param {?} password
     * @param {?=} userAttributes - Optional parameter
     * @param {?=} validationData - Optional parameter
     * @return {?}
     */
    CognitoService.prototype.signUp =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Registration ---------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * Register a new user
         *
         * @param {?} username
         * @param {?} password
         * @param {?=} userAttributes - Optional parameter
         * @param {?=} validationData - Optional parameter
         * @return {?}
         */
        function(username, password, userAttributes, validationData) {
            var _this = this;
            if (userAttributes === void 0) {
                userAttributes = [];
            }
            if (validationData === void 0) {
                validationData = [];
            }
            /** @type {?} */
            var userPool = new AWSCognito.CognitoUserPool(this.poolData);
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    userPool.signUp(username, password, userAttributes, validationData, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                _this.setUsername(username);
                                /** @type {?} */
                                var response_1 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_1);
                            }
                            console.error('CognitoService : signUp -> signUp', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    /**
     * Confirm the signUp action
     *
     * @param verificationCode
     * @param forceAliasCreation - Optional parameter
     */
    /**
     * Confirm the signUp action
     *
     * @param {?} verificationCode
     * @param {?=} forceAliasCreation - Optional parameter
     * @return {?}
     */
    CognitoService.prototype.confirmRegistration =
        /**
         * Confirm the signUp action
         *
         * @param {?} verificationCode
         * @param {?=} forceAliasCreation - Optional parameter
         * @return {?}
         */
        function(verificationCode, forceAliasCreation) {
            if (forceAliasCreation === void 0) {
                forceAliasCreation = false;
            }
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.confirmRegistration(verificationCode, forceAliasCreation, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                /** @type {?} */
                                var response_2 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_2);
                            }
                            console.error('CognitoService : confirmRegistration -> confirmRegistration', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    /**
     * Resend the signUp confirmation code
     */
    /**
     * Resend the signUp confirmation code
     * @return {?}
     */
    CognitoService.prototype.resendConfirmationCode =
        /**
         * Resend the signUp confirmation code
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.resendConfirmationCode((
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                /** @type {?} */
                                var response_3 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_3);
                            }
                            console.error('CognitoService : resendConfirmationCode -> resendConfirmationCode', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: MFA ------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Login 2nd step for users with MFA enabled
     *
     * @param mfaCode
     * @param mfaType - Optional parameter (SOFTWARE_TOKEN_MFA / SMS_MFA)
     */
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: MFA ------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Login 2nd step for users with MFA enabled
     *
     * @param {?} mfaCode
     * @param {?=} mfaType - Optional parameter (SOFTWARE_TOKEN_MFA / SMS_MFA)
     * @return {?}
     */
    CognitoService.prototype.sendMFACode =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: MFA ------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * Login 2nd step for users with MFA enabled
         *
         * @param {?} mfaCode
         * @param {?=} mfaType - Optional parameter (SOFTWARE_TOKEN_MFA / SMS_MFA)
         * @return {?}
         */
        function(mfaCode, mfaType) {
            var _this = this;
            if (mfaType === void 0) {
                mfaType = null;
            }
            // TODO: dynamic code
            // SOFTWARE_TOKEN_MFA
            // SMS_MFA
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.sendMFACode(mfaCode, {
                        onSuccess: (
                            /**
                             * @param {?} session
                             * @return {?}
                             */
                            function(session) {
                                _this.setUsername(cognitoUser.getUsername());
                                _this.updateTokens(session);
                                _this.setProvider(AuthType.COGNITO);
                                _this.updateCredentials();
                                _this.onSignIn.emit();
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                                return resolve(response);
                            }),
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : sendMFACode -> sendMFACode', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            })
                    }, mfaType);
                }));
        };
    /**
     * Return the user's MFA status
     */
    /**
     * Return the user's MFA status
     * @return {?}
     */
    CognitoService.prototype.getMFAOptions =
        /**
         * Return the user's MFA status
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.getMFAOptions((
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                /** @type {?} */
                                var response_4 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_4);
                            }
                            console.error('CognitoService : getMFAOptions -> getMFAOptions', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    /**
     * Return the user's MFA status (must have a phone_number set)
     *
     * @param enableMfa
     */
    /**
     * Return the user's MFA status (must have a phone_number set)
     *
     * @param {?} enableMfa
     * @return {?}
     */
    CognitoService.prototype.setMfa =
        /**
         * Return the user's MFA status (must have a phone_number set)
         *
         * @param {?} enableMfa
         * @return {?}
         */
        function(enableMfa) {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    if (enableMfa) {
                        cognitoUser.enableMFA((
                            /**
                             * @param {?} err
                             * @param {?} res
                             * @return {?}
                             */
                            function(err, res) {
                                if (res) {
                                    /** @type {?} */
                                    var response_5 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                    return resolve(response_5);
                                }
                                console.error('CognitoService : setMfa -> enableMFA', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }));
                    } else {
                        cognitoUser.disableMFA((
                            /**
                             * @param {?} err
                             * @param {?} res
                             * @return {?}
                             */
                            function(err, res) {
                                if (res) {
                                    /** @type {?} */
                                    var response_6 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                    return resolve(response_6);
                                }
                                console.error('CognitoService : setMfa -> disableMFA', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }));
                    }
                }));
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Password -------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Set a new password on the first connection (if a new password is required)
     *
     * @param newPassword
     * @param requiredAttributeData - Optional parameter
     */
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Password -------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Set a new password on the first connection (if a new password is required)
     *
     * @param {?} newPassword
     * @param {?=} requiredAttributeData - Optional parameter
     * @return {?}
     */
    CognitoService.prototype.newPasswordRequired =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Password -------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * Set a new password on the first connection (if a new password is required)
         *
         * @param {?} newPassword
         * @param {?=} requiredAttributeData - Optional parameter
         * @return {?}
         */
        function(newPassword, requiredAttributeData) {
            var _this = this;
            if (requiredAttributeData === void 0) {
                requiredAttributeData = {};
            }
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.completeNewPasswordChallenge(newPassword, requiredAttributeData, {
                        onSuccess: (
                            /**
                             * @param {?} session
                             * @return {?}
                             */
                            function(session) {
                                _this.updateTokens(session);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                                return resolve(response);
                            }),
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : newPasswordRequired -> completeNewPasswordChallenge', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }),
                        mfaRequired: (
                            /**
                             * @param {?} challengeName
                             * @param {?} challengeParameters
                             * @return {?}
                             */
                            function(challengeName, challengeParameters) {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.MFA_REQUIRED, {
                                    challengeName: challengeName,
                                    challengeParameters: challengeParameters
                                });
                                return resolve(response);
                            })
                    });
                }));
        };
    /**
     * Initiate forgot password flow
     *
     * @param username
     */
    /**
     * Initiate forgot password flow
     *
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.forgotPassword =
        /**
         * Initiate forgot password flow
         *
         * @param {?} username
         * @return {?}
         */
        function(username) {
            /** @type {?} */
            var cognitoUser = this.setCognitoUser(username);
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.forgotPassword({
                        onSuccess: (
                            /**
                             * @param {?} data
                             * @return {?}
                             */
                            function(data) {
                                // NOTE: onSuccess is called if there is no inputVerificationCode callback
                                // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/324
                                // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/323
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, data);
                                return resolve(response);
                            }),
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : forgotPassword -> forgotPassword', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }),
                        inputVerificationCode: (
                            /**
                             * @param {?} data
                             * @return {?}
                             */
                            function(data) {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.INPUT_VERIFICATION_CODE, data);
                                return resolve(response);
                            })
                    });
                }));
        };
    /**
     * Resend the forgotPassword verification code
     */
    /**
     * Resend the forgotPassword verification code
     * @return {?}
     */
    CognitoService.prototype.getAttributeVerificationCode =
        /**
         * Resend the forgotPassword verification code
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    /** @type {?} */
                    var name = null;
                    cognitoUser.getAttributeVerificationCode(name, {
                        onSuccess: (
                            /**
                             * @return {?}
                             */
                            function() {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                                return resolve(response);
                            }),
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : getAttributeVerificationCode -> getAttributeVerificationCode', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }),
                        inputVerificationCode: (
                            /**
                             * @param {?} data
                             * @return {?}
                             */
                            function(data) {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.INPUT_VERIFICATION_CODE, data);
                                return resolve(response);
                            })
                    });
                }));
        };
    /**
     * Finish forgot password flow
     *
     * @param newPassword
     * @param verificationCode
     */
    /**
     * Finish forgot password flow
     *
     * @param {?} newPassword
     * @param {?} verificationCode
     * @return {?}
     */
    CognitoService.prototype.confirmPassword =
        /**
         * Finish forgot password flow
         *
         * @param {?} newPassword
         * @param {?} verificationCode
         * @return {?}
         */
        function(newPassword, verificationCode) {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.confirmPassword(verificationCode, newPassword, {
                        onSuccess:
                            /**
                             * @return {?}
                             */
                            function() {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                                return resolve(response);
                            },
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : confirmPassword -> confirmPassword', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            })
                    });
                }));
        };
    /**
     * Update a user's password
     *
     * @param oldPassword
     * @param newPassword
     */
    /**
     * Update a user's password
     *
     * @param {?} oldPassword
     * @param {?} newPassword
     * @return {?}
     */
    CognitoService.prototype.changePassword =
        /**
         * Update a user's password
         *
         * @param {?} oldPassword
         * @param {?} newPassword
         * @return {?}
         */
        function(oldPassword, newPassword) {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.changePassword(oldPassword, newPassword, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                /** @type {?} */
                                var response_7 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_7);
                            }
                            console.error('CognitoService : changePassword -> changePassword', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Admin ----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Admin ----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @param {?} username
     * @param {?} password
     * @return {?}
     */
    CognitoService.prototype.adminCreateUser =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Admin ----------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * @param {?} username
         * @param {?} password
         * @return {?}
         */
         function(username, password, email, promotionId, clientList, firstName, lastName, onlineSubmission, resubmission){
            this.setAdmin();
            /** @type {?} */
            // var params = {
            //     UserPoolId: this.poolData.UserPoolId,
            //     Username: username,
            //     TemporaryPassword: password
            // };

            var params = {
                UserPoolId: this.poolData.UserPoolId,
                Username: username,
                TemporaryPassword: password,
                UserAttributes: [{
                        "Name": "email",
                        "Value": email
                    },
                    {
                        "Name": "custom:promotionId",
                        "Value": promotionId
                    },
                    {
                        "Name": "custom:clientList",
                        "Value": clientList
                    },
                    {
                        "Name": "name",
                        "Value": firstName
                    },
                    {
                        "Name": "family_name",
                        "Value": lastName
                    },
                    {
                        "Name": "custom:onlineSubmission",
                        "Value": onlineSubmission
                    },
                    {
                        "Name": "custom:resubmission",
                        "Value": resubmission
                    }
                ]
            };

            /** @type {?} */
            var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoIdentityServiceProvider.adminCreateUser(params, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res)
                                return resolve(res);
                            console.error('CognitoService : adminCreateUser -> adminCreateUser', err);
                            return reject(err);
                        }));
                }));
        };
    /**
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.adminDeleteUser =
        /**
         * @param {?} username
         * @return {?}
         */
        function(username) {
            this.setAdmin();
            /** @type {?} */
            var params = {
                UserPoolId: this.poolData.UserPoolId,
                Username: username
            };
            /** @type {?} */
            var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoIdentityServiceProvider.adminDeleteUser(params, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res)
                                return resolve(res);
                            console.error('CognitoService : adminDeleteUser -> adminDeleteUser', err);
                            return reject(err);
                        }));
                }));
        };
        /**
         * @param {?} username
         * @return {?}
         */
        CognitoService.prototype.adminGetUser =
            /**
             * @param {?} username
             * @return {?}
             */
            function(username) {
                this.setAdmin();
                /** @type {?} */
                var params = {
                    UserPoolId: this.poolData.UserPoolId,
                    Username: username
                };
                /** @type {?} */
                var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
                return new Promise((
                    /**
                     * @param {?} resolve
                     * @param {?} reject
                     * @return {?}
                     */
                    function(resolve, reject) {
                        cognitoIdentityServiceProvider.adminGetUser(params, (
                            /**
                             * @param {?} err
                             * @param {?} res
                             * @return {?}
                             */
                            function(err, res) {
                                if (res)
                                    return resolve(res);
                                console.error('CognitoService : adminGetUser -> adminGetUser', err);
                                return reject(err);
                            }));
                    }));
            };

            CognitoService.prototype.adminListGroupsForUser =

            function(username,limit) {
                this.setAdmin();
                /** @type {?} */
                var params = {
                    Limit: limit,
                    UserPoolId: this.poolData.UserPoolId,
                    Username: username
                };
                /** @type {?} */
                var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
                return new Promise((
                        /**
                         * @param {?} resolve
                         * @param {?} reject
                         * @return {?}
                         */
                         function(resolve, reject) {
                            cognitoIdentityServiceProvider.adminListGroupsForUser(params, (
                                /**
                                 * @param {?} err
                                 * @param {?} res
                                 * @return {?}
                                 */
                                 function(err, res) {
                                    if (res)
                                        return resolve(res);
                                    console.error('CognitoService : adminListGroupsForUser -> adminListGroupsForUser', err);
                                    return reject(err);
                                }));
                        }));
            };

    /**
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.adminResetUserPassword =
        /**
         * @param {?} username
         * @return {?}
         */
        function(username) {
            this.setAdmin();
            /** @type {?} */
            var params = {
                UserPoolId: this.poolData.UserPoolId,
                Username: username
            };
            /** @type {?} */
            var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoIdentityServiceProvider.adminResetUserPassword(params, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res)
                                return resolve(res);
                            console.error('CognitoService : adminResetUserPassword -> adminResetUserPassword', err);
                            return reject(err);
                        }));
                }));
        };
    /**
     * @param {?} username
     * @param {?} userAttributes
     * @return {?}
     */
    CognitoService.prototype.adminUpdateUserAttributes =
        /**
         * @param {?} username
         * @param {?} userAttributes
         * @return {?}
         */
        function(username, userAttributes) {
            this.setAdmin();
            /** @type {?} */
            var params = {
                UserPoolId: this.poolData.UserPoolId,
                Username: username,
                UserAttributes: userAttributes
            };
            /** @type {?} */
            var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoIdentityServiceProvider.adminUpdateUserAttributes(params, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res)
                                return resolve(res);
                            console.error('CognitoService : adminUpdateUserAttributes -> adminUpdateUserAttributes', err);
                            return reject(err);
                        }));
                }));
        };
    /**
     * @param {?} usernameKey
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.resetExpiredAccount =
        /**
         * @param {?} usernameKey
         * @param {?} username
         * @return {?}
         */
        function(usernameKey, username) {
            /** @type {?} */
            var attributes = [];
            attributes.push({
                Name: usernameKey,
                Value: username
            });
            return this.adminUpdateUserAttributes(username, attributes);
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.setAdmin =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var creds = new AWS.Credentials(this.adminAccessKeyId, this.adminSecretKeyId);
            AWS.config.region = this.region;
            AWS.config.credentials = creds;
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Authentication -------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Connect an existing user
     *
     * @param provider - Use the AuthType enum to send an authorized authentication provider
     * @param username
     * @param password
     */
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Authentication -------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * Connect an existing user
     *
     * @param {?} provider - Use the AuthType enum to send an authorized authentication provider
     * @param {?=} username
     * @param {?=} password
     * @return {?}
     */
    CognitoService.prototype.signIn =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Authentication -------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * Connect an existing user
         *
         * @param {?} provider - Use the AuthType enum to send an authorized authentication provider
         * @param {?=} username
         * @param {?=} password
         * @return {?}
         */
        function(provider, username, password) {
            switch (provider) {
                case AuthType.COGNITO:
                    return this.authenticateCognitoUser(username, password);
                case AuthType.GOOGLE:
                    return this.callGoogle(GoogleAction.AUTHENTICATE);
                default:
                    /** @type {?} */
                    var error = 'Provider not recognized : use the AuthType enum to send an authorized authentication provider';
                    console.error(error);
                    /** @type {?} */
                    var response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                    return Promise.reject(response);
            }
        };
    /**
     * Refresh a user's session (retrieve refreshed tokens)
     */
    /**
     * Refresh a user's session (retrieve refreshed tokens)
     * @return {?}
     */
    CognitoService.prototype.refreshSession =
        /**
         * Refresh a user's session (retrieve refreshed tokens)
         * @return {?}
         */
        function() {
            /** @type {?} */
            var provider = null;
            provider = this.getProvider();
            switch (provider) {
                case AuthType.COGNITO:
                    return this.refreshCognitoSession();
                case AuthType.GOOGLE:
                    return this.callGoogle(GoogleAction.REFRESH);
                default:
                    /** @type {?} */
                    var error = 'Provider not recognized : the user must be logged in before updating the session';
                    console.error(error);
                    /** @type {?} */
                    var response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                    return Promise.reject(response);
            }
        };
    /**
     * @return {?}
     */
    CognitoService.prototype.signOut =
        /**
         * @return {?}
         */
        function() {
            /** @type {?} */
            var provider = null;
            provider = this.getProvider();
            switch (provider) {
                case AuthType.COGNITO:
                    this.signOutCognito();
                    break;
                case AuthType.GOOGLE:
                    this.callGoogle(GoogleAction.LOGOUT);
                    break;
                default:
                    console.error('Provider not recognized : the user must be logged in before logging out');
                    break;
            }
            this.onSignOut.emit();
            this.clearStorage();
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Cognito --------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Cognito --------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @private
     * @param {?} username
     * @param {?} password
     * @return {?}
     */
    CognitoService.prototype.authenticateCognitoUser =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Cognito --------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * @private
         * @param {?} username
         * @param {?} password
         * @return {?}
         */
        function(username, password) {
            var _this = this;
            /** @type {?} */
            var authenticationData = {
                Username: username,
                Password: password
            };
            /** @type {?} */
            var authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
            /** @type {?} */
            var cognitoUser = this.getCognitoUser(username);
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.authenticateUser(authenticationDetails, {
                        newPasswordRequired: (
                            /**
                             * @param {?} userAttributes
                             * @param {?} requiredAttributes
                             * @return {?}
                             */
                            function(userAttributes, requiredAttributes) {
                                _this.cognitoUser = cognitoUser; // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/365
                                // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/365
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.NEW_PASSWORD_REQUIRED, {
                                    userAttributes: userAttributes,
                                    requiredAttributes: requiredAttributes
                                });
                                return resolve(response);
                            }),
                        onSuccess: (
                            /**
                             * @param {?} session
                             * @return {?}
                             */
                            function(session) {
                                _this.setUsername(username);
                                _this.updateTokens(session);
                                _this.setProvider(AuthType.COGNITO);
                                _this.updateCredentials();
                                _this.onSignIn.emit();
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                                return resolve(response);
                            }),
                        onFailure: (
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : authenticateCognitoUser -> authenticateUser', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }),
                        mfaSetup: (
                            /**
                             * @param {?} challengeName
                             * @param {?} challengeParameters
                             * @return {?}
                             */
                            function(challengeName, challengeParameters) {
                                cognitoUser.associateSoftwareToken({
                                    associateSecretCode: (
                                        /**
                                         * @param {?} secretCode
                                         * @return {?}
                                         */
                                        function(secretCode) {
                                            /** @type {?} */
                                            var response = new CognitoServiceResponse(RespType.MFA_SETUP_ASSOCIATE_SECRETE_CODE, secretCode);
                                            return resolve(response);
                                        }),
                                    onFailure: (
                                        /**
                                         * @param {?} err
                                         * @return {?}
                                         */
                                        function(err) {
                                            /** @type {?} */
                                            var response = new CognitoServiceResponse(RespType.MFA_SETUP_ON_FAILURE, err);
                                            return reject(response);
                                        })
                                });
                            }),
                        mfaRequired: (
                            /**
                             * @param {?} challengeName
                             * @param {?} challengeParameters
                             * @return {?}
                             */
                            function(challengeName, challengeParameters) {
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.MFA_REQUIRED, {
                                    challengeName: challengeName,
                                    challengeParameters: challengeParameters
                                });
                                return resolve(response);
                            })
                    });
                }));
        };
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.refreshCognitoSession =
        /**
         * @private
         * @return {?}
         */
        function() {
            var _this = this;
            /** @type {?} */
            var tokens = this.getTokens();
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            /** @type {?} */
            var refreshToken = new AWSCognito.CognitoRefreshToken({
                RefreshToken: tokens.refreshToken
            });
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    cognitoUser.refreshSession(refreshToken, (
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        function(err, res) {
                            if (res) {
                                _this.updateTokens(res);
                                _this.updateCredentials();
                                /** @type {?} */
                                var response_8 = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response_8);
                            }
                            console.error('CognitoService : refreshSession -> refreshSession', err);
                            /** @type {?} */
                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }));
        };
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.signOutCognito =
        /**
         * @private
         * @return {?}
         */
        function() {
            /** @type {?} */
            var cognitoUser = this.getCognitoUser();
            if (cognitoUser)
                cognitoUser.signOut();
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Google ---------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Google ---------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.initGoogle =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // SECTION: Google ---------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        /**
         * @private
         * @return {?}
         */
        function() {
            var _this = this;
            /** @type {?} */
            var params = {
                client_id: this.googleId,
                scope: this.googleScope
            };
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    gapi.load('auth2', {
                        callback: (
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            function(_) {
                                gapi.auth2.init(params)
                                    .then((
                                        /**
                                         * @param {?} googleAuth
                                         * @return {?}
                                         */
                                        function(googleAuth) {
                                            _this.googleAuth = googleAuth;
                                            /** @type {?} */
                                            var response = new CognitoServiceResponse(RespType.ON_SUCCESS, googleAuth);
                                            return resolve(response);
                                        }), (
                                        /**
                                         * @param {?} reason
                                         * @return {?}
                                         */
                                        function(reason) {
                                            console.error('CognitoService : initGoogle -> GoogleAuth', reason);
                                            /** @type {?} */
                                            var response = new CognitoServiceResponse(RespType.ON_FAILURE, reason);
                                            return reject(response);
                                        }));
                            }),
                        onerror: (
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            function(_) {
                                // Handle loading error
                                /** @type {?} */
                                var error = 'gapi.client failed to load';
                                console.error('CognitoService : initGoogle -> load', error);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_ERROR, error);
                                return reject(response);
                            }),
                        timeout: 5000,
                        // 5 seconds
                        ontimeout: (
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            function(_) {
                                // Handle timeout
                                /** @type {?} */
                                var error = 'gapi.client could not load in a timely manner';
                                console.error('CognitoService : initGoogle -> load', error);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_TIMEOUT, error);
                                return reject(response);
                            })
                    });
                }));
        };
    /**
     * @private
     * @param {?} action
     * @return {?}
     */
    CognitoService.prototype.callGoogle =
        /**
         * @private
         * @param {?} action
         * @return {?}
         */
        function(action) {
            var _this = this;
            if (this.googleAuth) {
                return this.makeGoogle(action);
            } else {
                return new Promise((
                    /**
                     * @param {?} resolve
                     * @param {?} reject
                     * @return {?}
                     */
                    function(resolve, reject) {
                        _this.initGoogle()
                            .then((
                                /**
                                 * @param {?} _
                                 * @return {?}
                                 */
                                function(_) {
                                    _this.makeGoogle(action)
                                        .then((
                                            /**
                                             * @param {?} res
                                             * @return {?}
                                             */
                                            function(res) {
                                                return resolve(res);
                                            }))
                                        .catch((
                                            /**
                                             * @param {?} err
                                             * @return {?}
                                             */
                                            function(err) {
                                                return reject(err);
                                            }));
                                }))
                            .catch((
                                /**
                                 * @param {?} error
                                 * @return {?}
                                 */
                                function(error) {
                                    /** @type {?} */
                                    var response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                                    return Promise.reject(response);
                                }));
                    }));
            }
        };
    /**
     * @private
     * @param {?} action
     * @return {?}
     */
    CognitoService.prototype.makeGoogle =
        /**
         * @private
         * @param {?} action
         * @return {?}
         */
        function(action) {
            switch (action) {
                case GoogleAction.AUTHENTICATE:
                    return this.authenticateGoogleUser();
                case GoogleAction.REFRESH:
                    return this.refreshGoogleSession();
                case GoogleAction.LOGOUT:
                    this.signOutGoogle();
                    /** @type {?} */
                    var logoutResponse = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                    return Promise.resolve(logoutResponse);
                default:
                    /** @type {?} */
                    var error = 'Google action not recognized : authenticate / refresh / logout';
                    console.error(error);
                    /** @type {?} */
                    var defaultResponse = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                    return Promise.reject(defaultResponse);
            }
        };
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.authenticateGoogleUser =
        /**
         * @private
         * @return {?}
         */
        function() {
            var _this = this;
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    /** @type {?} */
                    var options = {
                        scope: _this.googleScope
                    };
                    _this.googleAuth.signIn(options)
                        .then((
                            /**
                             * @param {?} googleUser
                             * @return {?}
                             */
                            function(googleUser) {
                                /** @type {?} */
                                var googleResponse = googleUser.getAuthResponse();
                                /** @type {?} */
                                var googleProfile = googleUser.getBasicProfile();
                                _this.setUsername(googleProfile.getName());
                                _this.setIdToken(googleResponse.id_token);
                                _this.setExpiresAt(googleResponse.expires_at);
                                _this.setProvider(AuthType.GOOGLE);
                                _this.updateCredentials();
                                _this.onSignIn.emit();
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, googleProfile);
                                return resolve(response);
                            }), (
                            /**
                             * @param {?} onRejected
                             * @return {?}
                             */
                            function(onRejected) {
                                // Can be : popup_blocked_by_browser
                                console.error('CognitoService : authenticateGoogleUser -> signIn', onRejected);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_REJECTED, onRejected);
                                return reject(response);
                            }))
                        .catch((
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : authenticateGoogleUser -> signIn', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }));
                }));
        };
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.refreshGoogleSession =
        /**
         * @private
         * @return {?}
         */
        function() {
            var _this = this;
            /** @type {?} */
            var googleUser = null;
            googleUser = this.googleAuth.currentUser.get();
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                function(resolve, reject) {
                    googleUser.reloadAuthResponse()
                        .then((
                            /**
                             * @param {?} res
                             * @return {?}
                             */
                            function(res) {
                                _this.setIdToken(res.id_token);
                                _this.setExpiresAt(res.expires_at);
                                _this.updateCredentials();
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response);
                            }))
                        .catch((
                            /**
                             * @param {?} err
                             * @return {?}
                             */
                            function(err) {
                                console.error('CognitoService : refreshGoogleSession -> reloadAuthResponse', err);
                                /** @type {?} */
                                var response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                                return reject(response);
                            }));
                }));
        };
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.signOutGoogle =
        /**
         * @private
         * @return {?}
         */
        function() {
            var _this = this;
            this.googleAuth.signOut()
                .then((
                    /**
                     * @param {?} _
                     * @return {?}
                     */
                    function(_) {
                        _this.googleAuth.disconnect();
                    }));
        };
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // TODO: Facebook ----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // SECTION: Private helpers ------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // NOTE: User --------------------------------------------------------------------------------
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // TODO: Facebook ----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // SECTION: Private helpers ------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    // NOTE: User --------------------------------------------------------------------------------
    /**
     * @private
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.setCognitoUser =
        // !SECTION
        // -------------------------------------------------------------------------------------------
        // TODO: Facebook ----------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        // SECTION: Private helpers ------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------
        // NOTE: User --------------------------------------------------------------------------------
        /**
         * @private
         * @param {?} username
         * @return {?}
         */
        function(username) {
            /** @type {?} */
            var cognitoUser = null;
            /** @type {?} */
            var cognitoUserPool = new AWSCognito.CognitoUserPool(this.poolData);
            /** @type {?} */
            var userData = {
                Username: username,
                Pool: cognitoUserPool
            };
            cognitoUser = new AWSCognito.CognitoUser(userData);
            this.cognitoUser = cognitoUser; // Store the user in the service
            this.setUsername(username); // Store the username in the local storage
            return cognitoUser;
        };
    // NOTE: Session -----------------------------------------------------------------------------
    // NOTE: Session -----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} expiresAt
     * @return {?}
     */
    CognitoService.prototype.setExpiresAt =
        // NOTE: Session -----------------------------------------------------------------------------
        /**
         * @private
         * @param {?} expiresAt
         * @return {?}
         */
        function(expiresAt) {
            /** @type {?} */
            var storageKey = null;
            storageKey = this.storagePrefix + 'ExpiresAt';
            localStorage.setItem(storageKey, expiresAt.toString());
        };
    // NOTE: Username ----------------------------------------------------------------------------
    // NOTE: Username ----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} username
     * @return {?}
     */
    CognitoService.prototype.setUsername =
        // NOTE: Username ----------------------------------------------------------------------------
        /**
         * @private
         * @param {?} username
         * @return {?}
         */
        function(username) {
            /** @type {?} */
            var storageKey = null;
            storageKey = this.storagePrefix + 'Username';
            localStorage.setItem(storageKey, username);
        };
    // NOTE: Provider ----------------------------------------------------------------------------
    // NOTE: Provider ----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} provider
     * @return {?}
     */
    CognitoService.prototype.setProvider =
        // NOTE: Provider ----------------------------------------------------------------------------
        /**
         * @private
         * @param {?} provider
         * @return {?}
         */
        function(provider) {
            /** @type {?} */
            var storageKey = null;
            storageKey = this.storagePrefix + 'Provider';
            localStorage.setItem(storageKey, provider);
        };
    // NOTE: Token -------------------------------------------------------------------------------
    // NOTE: Token -------------------------------------------------------------------------------
    /**
     * @private
     * @param {?} token
     * @return {?}
     */
    CognitoService.prototype.setIdToken =
        // NOTE: Token -------------------------------------------------------------------------------
        /**
         * @private
         * @param {?} token
         * @return {?}
         */
        function(token) {
            /** @type {?} */
            var storageKey = null;
            storageKey = this.storagePrefix + 'IdToken';
            localStorage.setItem(storageKey, token);
        };
    /**
     * @private
     * @param {?} session
     * @return {?}
     */
    CognitoService.prototype.setTokens =
        /**
         * @private
         * @param {?} session
         * @return {?}
         */
        function(session) {
            /** @type {?} */
            var storageKey = null;
            /** @type {?} */
            var tokensStr = null;
            /** @type {?} */
            var tokensObj = null;
            storageKey = this.storagePrefix + 'SessionTokens';
            tokensObj = {
                accessToken: session.getAccessToken()
                    .getJwtToken(),
                accessTokenExpiresAt: session.getAccessToken()
                    .getExpiration() * 1000,
                // Seconds to milliseconds
                idToken: session.getIdToken()
                    .getJwtToken(),
                idTokenExpiresAt: session.getIdToken()
                    .getExpiration() * 1000,
                // Seconds to milliseconds
                refreshToken: session.getRefreshToken()
                    .getToken()
            };
            tokensStr = JSON.stringify(tokensObj);
            localStorage.setItem(storageKey, tokensStr);
        };
    /**
     * @private
     * @param {?} session
     * @return {?}
     */
    CognitoService.prototype.updateTokens =
        /**
         * @private
         * @param {?} session
         * @return {?}
         */
        function(session) {
            /** @type {?} */
            var tokens = null;
            this.setTokens(session);
            tokens = this.getTokens();
            this.setIdToken(tokens.idToken);
            this.setExpiresAt(tokens.idTokenExpiresAt);
        };
    // NOTE: Storage -----------------------------------------------------------------------------
    // NOTE: Storage -----------------------------------------------------------------------------
    /**
     * @private
     * @return {?}
     */
    CognitoService.prototype.clearStorage =
        // NOTE: Storage -----------------------------------------------------------------------------
        /**
         * @private
         * @return {?}
         */
        function() {
            localStorage.removeItem(this.storagePrefix + 'Username');
            localStorage.removeItem(this.storagePrefix + 'Provider');
            localStorage.removeItem(this.storagePrefix + 'IdToken');
            localStorage.removeItem(this.storagePrefix + 'ExpiresAt');
            localStorage.removeItem(this.storagePrefix + 'SessionTokens');
        };
    CognitoService.decorators = [{
        type: Injectable,
        args: [{
            providedIn: 'root'
        }, ]
    }];
    /** @nocollapse */
    CognitoService.ctorParameters = function() {
        return [{
            type: undefined,
            decorators: [{
                type: Inject,
                args: ['cognitoConst', ]
            }, {
                type: Optional
            }]
        }];
    };
    /** @nocollapse */
    CognitoService.ngInjectableDef = i0.defineInjectable({
        factory: function CognitoService_Factory() {
            return new CognitoService(i0.inject("cognitoConst", 8));
        },
        token: CognitoService,
        providedIn: "root"
    });
    return CognitoService;
}());
export {
    CognitoService
};
if (false) {
    /** @type {?} */
    CognitoService.prototype.onSignIn;
    /** @type {?} */
    CognitoService.prototype.onSignOut;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.storagePrefix;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.googleId;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.googleScope;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.poolData;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.identityPool;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.region;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.adminAccessKeyId;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.adminSecretKeyId;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.googleAuth;
    /**
     * @type {?}
     * @private
     */
    CognitoService.prototype.cognitoUser;
    /** @type {?} */
    CognitoService.prototype.cognitoConst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQGNhbGlhdHlzL2NvZ25pdG8tc2VydmljZS8iLCJzb3VyY2VzIjpbImxpYi9jb2duaXRvLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQWtCLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQXNCLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQW9CLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQWdCLGVBQWUsQ0FBQzs7QUFHdkQsT0FBTyxLQUFLLFVBQVUsTUFBaUIsNEJBQTRCLENBQUM7QUFDcEUsT0FBTyxLQUFLLEdBQUcsTUFBd0IsU0FBUyxDQUFDOztBQUlqRCxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQzs7QUFHakYsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFvQix3QkFBd0IsQ0FBQztBQUNoRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQW9CLHdCQUF3QixDQUFDOzs7O0lBSTlELGNBQWUsY0FBYztJQUM3QixTQUFlLFNBQVM7SUFDeEIsUUFBZSxRQUFROzs7QUFHekI7SUE2QkUsd0JBRTZDLFlBQWtCO1FBQWxCLGlCQUFZLEdBQVosWUFBWSxDQUFNO1FBaEJ2RCxhQUFRLEdBQXFDO1lBQ25ELFVBQVUsRUFBRyxJQUFJOztZQUNqQixRQUFRLEVBQUssSUFBSSxDQUFFLHdCQUF3QjtTQUM1QyxDQUFDO1FBZ0JBLElBQUksQ0FBQyxRQUFRLEdBQWUsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFjLElBQUksWUFBWSxFQUFFLENBQUM7UUFFL0MsSUFBSSxDQUFDLGFBQWEsR0FBUyxZQUFZLENBQUMsYUFBYSxHQUFHLGtCQUFrQixDQUFDO1FBRTNFLElBQUksQ0FBQyxRQUFRLEdBQWMsWUFB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QUFrQzs7Ozs7SUFDbEMsZ0NBQWtDOzs7OztJQUVsQywwQ0FBa0M7Ozs7O0lBQ2xDLDBDQUFrQzs7Ozs7SUFFbEMsb0NBQWlEOzs7OztJQUNqRCxxQ0FBa0Q7O0lBSWhELHNDQUE2RCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEFuZ3VsYXIgbW9kdWxlc1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9ICAgICAgICAgICAgIGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgSW5qZWN0IH0gICAgICAgICAgICAgICAgIGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT3B0aW9uYWwgfSAgICAgICAgICAgICAgIGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gICAgICAgICAgIGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vLyBFeHRlcm5hbCBtb2R1bGVzXG5pbXBvcnQgKiBhcyBBV1NDb2duaXRvICAgICAgICAgICAgZnJvbSAnYW1hem9uLWNvZ25pdG8taWRlbnRpdHktanMnO1xuaW1wb3J0ICogYXMgQVdTICAgICAgICAgICAgICAgICAgIGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0ICogYXMgYXdzc2VydmljZSAgICAgICAgICAgIGZyb20gJ2F3cy1zZGsvbGliL3NlcnZpY2UnO1xuXG4vLyBNb2RlbHNcbmltcG9ydCB7IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UgfSBmcm9tICcuL21vZGVscy9jb2duaXRvLXNlcnZpY2UtcmVzcG9uc2UubW9kZWwnO1xuXG4vLyBFbnVtc1xuaW1wb3J0IHsgQXV0aFR5cGUgfSAgICAgICAgICAgICAgIGZyb20gJy4vZW51bXMvYXV0aC10eXBlLmVudW0nO1xuaW1wb3J0IHsgUmVzcFR5cGUgfSAgICAgICAgICAgICAgIGZyb20gJy4vZW51bXMvcmVzcC10eXBlLmVudW0nO1xuXG5leHBvcnQgZW51bSBHb29nbGVBY3Rpb25cbntcbiAgQVVUSEVOVElDQVRFID0gJ2F1dGhlbnRpY2F0ZScsXG4gIFJFRlJFU0ggICAgICA9ICdyZWZyZXNoJyxcbiAgTE9HT1VUICAgICAgID0gJ2xvZ291dCdcbn1cblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluIDogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIENvZ25pdG9TZXJ2aWNlXG57XG4gIHB1YmxpYyAgb25TaWduSW4gICAgICAgICAgOiBFdmVudEVtaXR0ZXI8bnVsbD47XG4gIHB1YmxpYyAgb25TaWduT3V0ICAgICAgICAgOiBFdmVudEVtaXR0ZXI8bnVsbD47XG5cbiAgLy8gcHJpdmF0ZSBNRkEgICAgICAgICAgICAgIDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgc3RvcmFnZVByZWZpeCAgICA6IHN0cmluZztcblxuICBwcml2YXRlIGdvb2dsZUlkICAgICAgICAgOiBzdHJpbmc7XG4gIHByaXZhdGUgZ29vZ2xlU2NvcGUgICAgICA6IHN0cmluZztcblxuICBwcml2YXRlIHBvb2xEYXRhIDogQVdTQ29nbml0by5JQ29nbml0b1VzZXJQb29sRGF0YSA9IHtcbiAgICBVc2VyUG9vbElkIDogbnVsbCwgLy8gQ29nbml0b1VzZXJQb29sXG4gICAgQ2xpZW50SWQgICA6IG51bGwgIC8vIENvZ25pdG9Vc2VyUG9vbENsaWVudFxuICB9O1xuXG4gIHByaXZhdGUgaWRlbnRpdHlQb29sICAgICA6IHN0cmluZzsgLy8gQ29nbml0b0lkZW50aXR5UG9vbFxuICBwcml2YXRlIHJlZ2lvbiAgICAgICAgICAgOiBzdHJpbmc7IC8vIFJlZ2lvbiBNYXRjaGluZyBDb2duaXRvVXNlclBvb2wgcmVnaW9uXG5cbiAgcHJpdmF0ZSBhZG1pbkFjY2Vzc0tleUlkIDogc3RyaW5nO1xuICBwcml2YXRlIGFkbWluU2VjcmV0S2V5SWQgOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBnb29nbGVBdXRoICAgICAgIDogZ2FwaS5hdXRoMi5Hb29nbGVBdXRoO1xuICBwcml2YXRlIGNvZ25pdG9Vc2VyICAgICAgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyO1xuXG4gIGNvbnN0cnVjdG9yXG4gIChcbiAgICBASW5qZWN0KCdjb2duaXRvQ29uc3QnKSBAT3B0aW9uYWwoKSBwdWJsaWMgY29nbml0b0NvbnN0IDogYW55XG4gIClcbiAge1xuICAgIHRoaXMub25TaWduSW4gICAgICAgICAgICAgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5vblNpZ25PdXQgICAgICAgICAgICA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIHRoaXMuc3RvcmFnZVByZWZpeCAgICAgICA9IGNvZ25pdG9Db25zdC5zdG9yYWdlUHJlZml4ICsgJ19Db2duaXRvU2VydmljZV8nO1xuXG4gICAgdGhpcy5nb29nbGVJZCAgICAgICAgICAgID0gY29nbml0b0NvbnN0Lmdvb2dsZUlkO1xuICAgIHRoaXMuZ29vZ2xlU2NvcGUgICAgICAgICA9IGNvZ25pdG9Db25zdC5nb29nbGVTY29wZTtcblxuICAgIHRoaXMucG9vbERhdGEuVXNlclBvb2xJZCA9IGNvZ25pdG9Db25zdC5wb29sRGF0YS5Vc2VyUG9vbElkO1xuICAgIHRoaXMucG9vbERhdGEuQ2xpZW50SWQgICA9IGNvZ25pdG9Db25zdC5wb29sRGF0YS5DbGllbnRJZDtcblxuICAgIHRoaXMuaWRlbnRpdHlQb29sICAgICAgICA9IGNvZ25pdG9Db25zdC5pZGVudGl0eVBvb2w7XG5cbiAgICB0aGlzLnJlZ2lvbiAgICAgICAgICAgICAgPSBjb2duaXRvQ29uc3QucmVnaW9uO1xuICAgIHRoaXMuYWRtaW5BY2Nlc3NLZXlJZCAgICA9IGNvZ25pdG9Db25zdC5hZG1pbkFjY2Vzc0tleUlkO1xuICAgIHRoaXMuYWRtaW5TZWNyZXRLZXlJZCAgICA9IGNvZ25pdG9Db25zdC5hZG1pblNlY3JldEtleUlkO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBIZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOT1RFOiBNaXNjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHVibGljIGlzQXV0aGVudGljYXRlZCgpIDogYm9vbGVhblxuICB7XG4gICAgaWYgKHRoaXMuZ2V0UmVtYWluaW5nKCkpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwdWJsaWMgc3RzKCkgOiBQcm9taXNlPEFXUy5TVFMuR2V0Q2FsbGVySWRlbnRpdHlSZXNwb25zZSB8IEFXUy5BV1NFcnJvcj5cbiAge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGxldCBzdHMgPSBuZXcgQVdTLlNUUygpO1xuICAgICAgbGV0IHBhcmFtcyA6IEFXUy5TVFMuR2V0Q2FsbGVySWRlbnRpdHlSZXF1ZXN0ID0gbnVsbDtcbiAgICAgIHN0cy5nZXRDYWxsZXJJZGVudGl0eShwYXJhbXMsIChlcnIgOiBBV1MuQVdTRXJyb3IsIGRhdGEgOiBBV1MuU1RTLkdldENhbGxlcklkZW50aXR5UmVzcG9uc2UpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChkYXRhKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHN0cyAtPiBnZXRDYWxsZXJJZGVudGl0eScsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gTk9URTogU2Vzc2lvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBhdXRvUmVmcmVzaFNlc3Npb24oKSA6IHZvaWRcbiAge1xuICAgIGxldCBleHBpcmVzQXQgPSB0aGlzLmdldEV4cGlyZXNBdCgpO1xuICAgIGlmICghZXhwaXJlc0F0KVxuICAgICAgcmV0dXJuO1xuXG4gICAgbGV0IHRpbWVEaWZmID0gZXhwaXJlc0F0LmdldFRpbWUoKSAtIERhdGUubm93KCkgLSA2MDAwMDsgLy8gMSBtaW5cblxuICAgIGlmICh0aW1lRGlmZiA8IDApXG4gICAge1xuICAgICAgdGhpcy5zaWduT3V0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PlxuICAgIHtcbiAgICAgIC8vIFJlZnJlc2ggdG9rZW5cbiAgICAgIHRoaXMucmVmcmVzaFNlc3Npb24oKS50aGVuKF8gPT5cbiAgICAgIHtcbiAgICAgICAgdGhpcy5hdXRvUmVmcmVzaFNlc3Npb24oKTtcbiAgICAgIH0pLmNhdGNoKF8gPT5cbiAgICAgIHtcbiAgICAgICAgdGhpcy5zaWduT3V0KCk7XG4gICAgICB9KTtcbiAgICB9LCB0aW1lRGlmZik7XG4gIH1cblxuICBwdWJsaWMgZ2V0UmVtYWluaW5nKCkgOiBudW1iZXJcbiAge1xuICAgIGxldCByZW1haW5pbmcgOiBudW1iZXIgPSAwO1xuICAgIGxldCBub3cgICAgICAgOiBudW1iZXIgPSAwO1xuICAgIGxldCBtYXggICAgICAgOiBEYXRlICAgPSBudWxsO1xuICAgIG5vdyA9IERhdGUubm93KCk7XG4gICAgbWF4ID0gdGhpcy5nZXRFeHBpcmVzQXQoKTtcblxuICAgIGlmICghbWF4KVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmVtYWluaW5nID0gbWF4LmdldFRpbWUoKSAtIG5vdztcbiAgICBpZiAocmVtYWluaW5nIDw9IDApXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gcmVtYWluaW5nO1xuICB9XG5cbiAgcHVibGljIGdldEV4cGlyZXNBdCgpIDogRGF0ZVxuICB7XG4gICAgbGV0IHN0b3JhZ2VLZXkgICA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IGV4cGlyZXNBdFN0ciA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IGV4cGlyZXNBdE51bSA6IG51bWJlciA9IG51bGw7XG4gICAgbGV0IGV4cGlyZXNBdERhdCA6IERhdGUgICA9IG51bGw7XG4gICAgc3RvcmFnZUtleSAgID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ0V4cGlyZXNBdCc7XG4gICAgZXhwaXJlc0F0U3RyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSk7XG4gICAgaWYgKGV4cGlyZXNBdFN0cilcbiAgICB7XG4gICAgICBleHBpcmVzQXROdW0gPSBOdW1iZXIoZXhwaXJlc0F0U3RyKTtcbiAgICAgIGlmIChleHBpcmVzQXROdW0pXG4gICAgICAgIGV4cGlyZXNBdERhdCA9IG5ldyBEYXRlKGV4cGlyZXNBdE51bSk7XG4gICAgfVxuICAgIHJldHVybiBleHBpcmVzQXREYXQ7XG4gIH1cblxuICAvLyBOT1RFOiBVc2VybmFtZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHVibGljIGdldFVzZXJuYW1lKCkgOiBzdHJpbmdcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgcHJvdmlkZXIgICA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdVc2VybmFtZSc7XG4gICAgcHJvdmlkZXIgICA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIHJldHVybiBwcm92aWRlcjtcbiAgfVxuXG4gIC8vIE5PVEU6IFByb3ZpZGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgZ2V0UHJvdmlkZXIoKSA6IHN0cmluZ1xuICB7XG4gICAgbGV0IHN0b3JhZ2VLZXkgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCBwcm92aWRlciAgIDogc3RyaW5nID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Byb3ZpZGVyJztcbiAgICBwcm92aWRlciAgID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSk7XG4gICAgcmV0dXJuIHByb3ZpZGVyO1xuICB9XG5cbiAgLy8gTk9URTogVG9rZW4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBnZXRJZFRva2VuKCkgOiBzdHJpbmdcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgaWRUb2tlbiAgICA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdJZFRva2VuJztcbiAgICBpZFRva2VuICAgID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSk7XG4gICAgcmV0dXJuIGlkVG9rZW47XG4gIH1cblxuICBwdWJsaWMgZ2V0VG9rZW5zKCkgOiBhbnlcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgdG9rZW5zU3RyICA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IHRva2Vuc09iaiAgOiBhbnkgICAgPSBudWxsO1xuICAgIHN0b3JhZ2VLZXkgPSB0aGlzLnN0b3JhZ2VQcmVmaXggKyAnU2Vzc2lvblRva2Vucyc7XG4gICAgdG9rZW5zU3RyICA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIHRva2Vuc09iaiAgPSBKU09OLnBhcnNlKHRva2Vuc1N0cik7XG4gICAgcmV0dXJuIHRva2Vuc09iajtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBDcmVkZW50aWFscyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgaW5pdENyZWRlbnRpYWxzKCkgOiB2b2lkXG4gIHtcbiAgICBBV1MuY29uZmlnLmNyZWRlbnRpYWxzID0gbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlDcmVkZW50aWFscyh7XG4gICAgICBJZGVudGl0eVBvb2xJZCA6IHRoaXMuaWRlbnRpdHlQb29sLFxuICAgIH0pO1xuICAgIEFXUy5jb25maWcucmVnaW9uID0gdGhpcy5yZWdpb247XG4gIH1cblxuICBwdWJsaWMgZ2V0Q3JlZGVudGlhbHMoKSA6IFByb21pc2U8YW55PlxuICB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgbGV0IGNyZWRlbnRpYWxzID0gQVdTLmNvbmZpZy5jcmVkZW50aWFscyBhcyBhbnk7XG4gICAgICBpZiAoIWNyZWRlbnRpYWxzKVxuICAgICAge1xuICAgICAgICBsZXQgZXJyb3IgPSAnWW91IG11c3QgaW5pdGlhbGl6ZSB0aGUgY3JlZGVudGlhbHMgd2l0aCBpbml0Q3JlZGVudGlhbHMoKSc7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZ2V0Q3JlZGVudGlhbHMnLCBlcnJvcik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgY3JlZGVudGlhbHMuZ2V0KChlcnIpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGdldENyZWRlbnRpYWxzJywgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmUoQVdTLmNvbmZpZy5jcmVkZW50aWFscyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVDcmVkZW50aWFscyhjbGllbnRDb25maWcgPzogYXdzc2VydmljZS5TZXJ2aWNlQ29uZmlndXJhdGlvbk9wdGlvbnMpIDogdm9pZFxuICB7XG4gICAgbGV0IHVybCAgICAgIDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgcHJvdmlkZXIgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCBpZFRva2VuICA6IHN0cmluZyA9IG51bGw7XG5cbiAgICBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIoKTtcbiAgICBpZFRva2VuICA9IHRoaXMuZ2V0SWRUb2tlbigpO1xuXG4gICAgc3dpdGNoIChwcm92aWRlcilcbiAgICB7XG4gICAgICBjYXNlIEF1dGhUeXBlLkNPR05JVE8gOlxuICAgICAgICB1cmwgPSAnY29nbml0by1pZHAuJyArIHRoaXMucmVnaW9uLnRvTG93ZXJDYXNlKCkgKyAnLmFtYXpvbmF3cy5jb20vJyArIHRoaXMucG9vbERhdGEuVXNlclBvb2xJZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEF1dGhUeXBlLkdPT0dMRSA6XG4gICAgICAgIHVybCA9ICdhY2NvdW50cy5nb29nbGUuY29tJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0IDpcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBzZXRDcmVkZW50aWFscyAtPiBQcm92aWRlciBub3QgcmVjb2duaXplZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGxvZ2lucyA6IGFueSA9IHt9O1xuICAgIGxvZ2luc1t1cmxdID0gaWRUb2tlbjtcblxuICAgIGlmICghdGhpcy5pZGVudGl0eVBvb2wpXG4gICAge1xuICAgICAgY29uc29sZS5pbmZvKCdXZSByZWNvbW1lbmQgdGhhdCB5b3UgcHJvdmlkZSBhbiBpZGVudGl0eSBwb29sIElEIGZyb20gYSBmZWRlcmF0ZWQgaWRlbnRpdHknKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9ucyA6IEFXUy5Db2duaXRvSWRlbnRpdHlDcmVkZW50aWFscy5Db2duaXRvSWRlbnRpdHlPcHRpb25zID0ge1xuICAgICAgSWRlbnRpdHlQb29sSWQgOiB0aGlzLmlkZW50aXR5UG9vbCxcbiAgICAgIExvZ2lucyAgICAgICAgIDogbG9naW5zXG4gICAgfTtcblxuICAgIEFXUy5jb25maWcucmVnaW9uICAgICAgPSB0aGlzLnJlZ2lvbjtcbiAgICBBV1MuY29uZmlnLmNyZWRlbnRpYWxzID0gbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlDcmVkZW50aWFscyhvcHRpb25zLCBjbGllbnRDb25maWcpO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IFVzZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBnZXRDb2duaXRvVXNlcih1c2VybmFtZSA6IHN0cmluZyA9IG51bGwpIDogQVdTQ29nbml0by5Db2duaXRvVXNlclxuICB7XG4gICAgaWYgKHRoaXMuY29nbml0b1VzZXIpXG4gICAgICByZXR1cm4gdGhpcy5jb2duaXRvVXNlcjsgLy8gVXNlciBzdG9yZWQgaW4gdGhlIHNlcnZpY2VcblxuICAgIGxldCBjb2duaXRvVXNlciA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXIgPSBudWxsO1xuICAgIGxldCBjb2duaXRvVXNlclBvb2wgPSBuZXcgQVdTQ29nbml0by5Db2duaXRvVXNlclBvb2wodGhpcy5wb29sRGF0YSk7XG5cbiAgICBjb2duaXRvVXNlciA9IGNvZ25pdG9Vc2VyUG9vbC5nZXRDdXJyZW50VXNlcigpOyAvLyBBdXRoZW50aWNhdGVkIHVzZXJcblxuICAgIGlmICghY29nbml0b1VzZXIpXG4gICAge1xuICAgICAgbGV0IG5hbWUgOiBzdHJpbmcgPSBudWxsO1xuICAgICAgaWYgKHVzZXJuYW1lKVxuICAgICAgICBuYW1lID0gdXNlcm5hbWU7IC8vIFVzZXIgc2VudFxuICAgICAgZWxzZVxuICAgICAgICBuYW1lID0gdGhpcy5nZXRVc2VybmFtZSgpOyAvLyBVc2VyIHN0b3JlZCBpbiBsb2NhbCBzdG9yYWdlXG4gICAgICBjb2duaXRvVXNlciA9IHRoaXMuc2V0Q29nbml0b1VzZXIobmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZ25pdG9Vc2VyO1xuICB9XG5cbiAgcHVibGljIGdldFVzZXJBdHRyaWJ1dGVzKCkgOiBhbnlcbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICBjb2duaXRvVXNlci5nZXRVc2VyQXR0cmlidXRlcygoZXJyIDogRXJyb3IsIHJlcyA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJBdHRyaWJ1dGVbXSkgPT5cbiAgICB7XG4gICAgICBpZiAocmVzKVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBnZXRVc2VyQXR0cmlidXRlcyAtPiBnZXRVc2VyQXR0cmlidXRlcycsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgZGVsZXRlQXR0cmlidXRlcyhhdHRyaWJ1dGVMaXN0IDogc3RyaW5nW10pIDogYW55XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG4gICAgY29nbml0b1VzZXIuZGVsZXRlQXR0cmlidXRlcyhhdHRyaWJ1dGVMaXN0LCAoZXJyIDogRXJyb3IsIHJlcyA6IHN0cmluZykgPT5cbiAgICB7XG4gICAgICBpZiAocmVzKVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBkZWxldGVBdHRyaWJ1dGVzIC0+IGRlbGV0ZUF0dHJpYnV0ZXMnLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGdldFVzZXJEYXRhKCkgOiBhbnlcbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICBjb2duaXRvVXNlci5nZXRVc2VyRGF0YSgoZXJyIDogRXJyb3IsIHJlcyA6IEFXU0NvZ25pdG8uVXNlckRhdGEpID0+XG4gICAge1xuICAgICAgaWYgKHJlcylcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZ2V0VXNlckRhdGEgLT4gZ2V0VXNlckRhdGEnLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGRlbGV0ZVVzZXIoKSA6IGFueVxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuICAgIGNvZ25pdG9Vc2VyLmRlbGV0ZVVzZXIoKGVyciA6IEVycm9yLCByZXMgOiBzdHJpbmcpID0+XG4gICAge1xuICAgICAgaWYgKHJlcylcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZGVsZXRlVXNlciAtPiBkZWxldGVVc2VyJywgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBSZWdpc3RyYXRpb24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgdXNlclxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAqIEBwYXJhbSB1c2VyQXR0cmlidXRlcyAtIE9wdGlvbmFsIHBhcmFtZXRlclxuICAgKiBAcGFyYW0gdmFsaWRhdGlvbkRhdGEgLSBPcHRpb25hbCBwYXJhbWV0ZXJcbiAgICovXG4gIHB1YmxpYyBzaWduVXAodXNlcm5hbWUgOiBzdHJpbmcsIHBhc3N3b3JkIDogc3RyaW5nLCB1c2VyQXR0cmlidXRlcyA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJBdHRyaWJ1dGVbXSA9IFtdLCB2YWxpZGF0aW9uRGF0YSA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJBdHRyaWJ1dGVbXSA9IFtdKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCB1c2VyUG9vbCA9IG5ldyBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyUG9vbCh0aGlzLnBvb2xEYXRhKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIHVzZXJQb29sLnNpZ25VcCh1c2VybmFtZSwgcGFzc3dvcmQsIHVzZXJBdHRyaWJ1dGVzLCB2YWxpZGF0aW9uRGF0YSwgKGVyciA6IEVycm9yLCByZXMgOiBBV1NDb2duaXRvLklTaWduVXBSZXN1bHQpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLnNldFVzZXJuYW1lKHVzZXJuYW1lKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHNpZ25VcCAtPiBzaWduVXAnLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpcm0gdGhlIHNpZ25VcCBhY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHZlcmlmaWNhdGlvbkNvZGVcbiAgICogQHBhcmFtIGZvcmNlQWxpYXNDcmVhdGlvbiAtIE9wdGlvbmFsIHBhcmFtZXRlclxuICAgKi9cbiAgcHVibGljIGNvbmZpcm1SZWdpc3RyYXRpb24odmVyaWZpY2F0aW9uQ29kZSA6IHN0cmluZywgZm9yY2VBbGlhc0NyZWF0aW9uIDogYm9vbGVhbiA9IGZhbHNlKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLmNvbmZpcm1SZWdpc3RyYXRpb24odmVyaWZpY2F0aW9uQ29kZSwgZm9yY2VBbGlhc0NyZWF0aW9uLCAoZXJyIDogYW55LCByZXMgOiBhbnkpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGNvbmZpcm1SZWdpc3RyYXRpb24gLT4gY29uZmlybVJlZ2lzdHJhdGlvbicsIGVycik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZW5kIHRoZSBzaWduVXAgY29uZmlybWF0aW9uIGNvZGVcbiAgICovXG4gIHB1YmxpYyByZXNlbmRDb25maXJtYXRpb25Db2RlKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5yZXNlbmRDb25maXJtYXRpb25Db2RlKChlcnIgOiBFcnJvciwgcmVzIDogc3RyaW5nKSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgcmVzKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiByZXNlbmRDb25maXJtYXRpb25Db2RlIC0+IHJlc2VuZENvbmZpcm1hdGlvbkNvZGUnLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IE1GQSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBMb2dpbiAybmQgc3RlcCBmb3IgdXNlcnMgd2l0aCBNRkEgZW5hYmxlZFxuICAgKlxuICAgKiBAcGFyYW0gbWZhQ29kZVxuICAgKiBAcGFyYW0gbWZhVHlwZSAtIE9wdGlvbmFsIHBhcmFtZXRlciAoU09GVFdBUkVfVE9LRU5fTUZBIC8gU01TX01GQSlcbiAgICovXG4gIHB1YmxpYyBzZW5kTUZBQ29kZShtZmFDb2RlIDogc3RyaW5nLCBtZmFUeXBlIDogc3RyaW5nID0gbnVsbCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICAvLyBUT0RPOiBkeW5hbWljIGNvZGVcbiAgICAvLyBTT0ZUV0FSRV9UT0tFTl9NRkFcbiAgICAvLyBTTVNfTUZBXG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLnNlbmRNRkFDb2RlKG1mYUNvZGUsXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzcyA6IChzZXNzaW9uIDogQVdTQ29nbml0by5Db2duaXRvVXNlclNlc3Npb24pID0+XG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLnNldFVzZXJuYW1lKGNvZ25pdG9Vc2VyLmdldFVzZXJuYW1lKCkpO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9rZW5zKHNlc3Npb24pO1xuICAgICAgICAgIHRoaXMuc2V0UHJvdmlkZXIoQXV0aFR5cGUuQ09HTklUTyk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDcmVkZW50aWFscygpO1xuXG4gICAgICAgICAgdGhpcy5vblNpZ25Jbi5lbWl0KCk7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgc2Vzc2lvbik7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBvbkZhaWx1cmUgOiAoZXJyIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBzZW5kTUZBQ29kZSAtPiBzZW5kTUZBQ29kZScsIGVycik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSwgbWZhVHlwZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB1c2VyJ3MgTUZBIHN0YXR1c1xuICAgKi9cbiAgcHVibGljIGdldE1GQU9wdGlvbnMoKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLmdldE1GQU9wdGlvbnMoKGVyciA6IEVycm9yLCByZXMgOiBBV1NDb2duaXRvLk1GQU9wdGlvbltdKSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgcmVzKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBnZXRNRkFPcHRpb25zIC0+IGdldE1GQU9wdGlvbnMnLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdXNlcidzIE1GQSBzdGF0dXMgKG11c3QgaGF2ZSBhIHBob25lX251bWJlciBzZXQpXG4gICAqXG4gICAqIEBwYXJhbSBlbmFibGVNZmFcbiAgICovXG4gIHB1YmxpYyBzZXRNZmEoZW5hYmxlTWZhIDogYm9vbGVhbikgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBpZiAoZW5hYmxlTWZhKVxuICAgICAge1xuICAgICAgICBjb2duaXRvVXNlci5lbmFibGVNRkEoKGVyciA6IEVycm9yLCByZXMgOiBzdHJpbmcpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogc2V0TWZhIC0+IGVuYWJsZU1GQScsIGVycik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGNvZ25pdG9Vc2VyLmRpc2FibGVNRkEoKGVyciA6IEVycm9yLCByZXMgOiBzdHJpbmcpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogc2V0TWZhIC0+IGRpc2FibGVNRkEnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IFBhc3N3b3JkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgcGFzc3dvcmQgb24gdGhlIGZpcnN0IGNvbm5lY3Rpb24gKGlmIGEgbmV3IHBhc3N3b3JkIGlzIHJlcXVpcmVkKVxuICAgKlxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmRcbiAgICogQHBhcmFtIHJlcXVpcmVkQXR0cmlidXRlRGF0YSAtIE9wdGlvbmFsIHBhcmFtZXRlclxuICAgKi9cbiAgcHVibGljIG5ld1Bhc3N3b3JkUmVxdWlyZWQobmV3UGFzc3dvcmQgOiBzdHJpbmcsIHJlcXVpcmVkQXR0cmlidXRlRGF0YSA6IGFueSA9IHt9KSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLmNvbXBsZXRlTmV3UGFzc3dvcmRDaGFsbGVuZ2UobmV3UGFzc3dvcmQsIHJlcXVpcmVkQXR0cmlidXRlRGF0YSxcbiAgICAgIHtcbiAgICAgICAgb25TdWNjZXNzIDogKHNlc3Npb24gOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyU2Vzc2lvbikgPT5cbiAgICAgICAge1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9rZW5zKHNlc3Npb24pO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHNlc3Npb24pO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25GYWlsdXJlIDogKGVyciA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogbmV3UGFzc3dvcmRSZXF1aXJlZCAtPiBjb21wbGV0ZU5ld1Bhc3N3b3JkQ2hhbGxlbmdlJywgZXJyKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBtZmFSZXF1aXJlZCA6IChjaGFsbGVuZ2VOYW1lIDogYW55LCBjaGFsbGVuZ2VQYXJhbWV0ZXJzIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuTUZBX1JFUVVJUkVELCB7IGNoYWxsZW5nZU5hbWUgOiBjaGFsbGVuZ2VOYW1lLCBjaGFsbGVuZ2VQYXJhbWV0ZXJzIDogY2hhbGxlbmdlUGFyYW1ldGVycyB9KTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGZvcmdvdCBwYXNzd29yZCBmbG93XG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZVxuICAgKi9cbiAgcHVibGljIGZvcmdvdFBhc3N3b3JkKHVzZXJuYW1lIDogc3RyaW5nKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuc2V0Q29nbml0b1VzZXIodXNlcm5hbWUpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b1VzZXIuZm9yZ290UGFzc3dvcmQoXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzcyA6IChkYXRhIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgLy8gTk9URTogb25TdWNjZXNzIGlzIGNhbGxlZCBpZiB0aGVyZSBpcyBubyBpbnB1dFZlcmlmaWNhdGlvbkNvZGUgY2FsbGJhY2tcbiAgICAgICAgICAvLyBOT1RFOiBodHRwczovL2dpdGh1Yi5jb20vYW1hem9uLWFyY2hpdmVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2lzc3Vlcy8zMjRcbiAgICAgICAgICAvLyBOT1RFOiBodHRwczovL2dpdGh1Yi5jb20vYW1hem9uLWFyY2hpdmVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2lzc3Vlcy8zMjNcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBkYXRhKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmFpbHVyZSA6IChlcnIgOiBFcnJvcikgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZm9yZ290UGFzc3dvcmQgLT4gZm9yZ290UGFzc3dvcmQnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGlucHV0VmVyaWZpY2F0aW9uQ29kZSA6IChkYXRhIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuSU5QVVRfVkVSSUZJQ0FUSU9OX0NPREUsIGRhdGEpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZW5kIHRoZSBmb3Jnb3RQYXNzd29yZCB2ZXJpZmljYXRpb24gY29kZVxuICAgKi9cbiAgcHVibGljIGdldEF0dHJpYnV0ZVZlcmlmaWNhdGlvbkNvZGUoKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGxldCBuYW1lIDogc3RyaW5nID0gbnVsbDtcbiAgICAgIGNvZ25pdG9Vc2VyLmdldEF0dHJpYnV0ZVZlcmlmaWNhdGlvbkNvZGUobmFtZSxcbiAgICAgIHtcbiAgICAgICAgb25TdWNjZXNzIDogKCkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIG51bGwpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25GYWlsdXJlIDogKGVyciA6IEVycm9yKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBnZXRBdHRyaWJ1dGVWZXJpZmljYXRpb25Db2RlIC0+IGdldEF0dHJpYnV0ZVZlcmlmaWNhdGlvbkNvZGUnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGlucHV0VmVyaWZpY2F0aW9uQ29kZSA6IChkYXRhIDogc3RyaW5nKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuSU5QVVRfVkVSSUZJQ0FUSU9OX0NPREUsIGRhdGEpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmluaXNoIGZvcmdvdCBwYXNzd29yZCBmbG93XG4gICAqXG4gICAqIEBwYXJhbSBuZXdQYXNzd29yZFxuICAgKiBAcGFyYW0gdmVyaWZpY2F0aW9uQ29kZVxuICAgKi9cbiAgcHVibGljIGNvbmZpcm1QYXNzd29yZChuZXdQYXNzd29yZCA6IHN0cmluZywgdmVyaWZpY2F0aW9uQ29kZSA6IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5jb25maXJtUGFzc3dvcmQodmVyaWZpY2F0aW9uQ29kZSwgbmV3UGFzc3dvcmQsXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzcygpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBudWxsKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmFpbHVyZSA6IChlcnIgOiBFcnJvcikgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogY29uZmlybVBhc3N3b3JkIC0+IGNvbmZpcm1QYXNzd29yZCcsIGVycik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgdXNlcidzIHBhc3N3b3JkXG4gICAqXG4gICAqIEBwYXJhbSBvbGRQYXNzd29yZFxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmRcbiAgICovXG4gIHB1YmxpYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCA6IHN0cmluZywgbmV3UGFzc3dvcmQgOiBzdHJpbmcpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b1VzZXIuY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyIDogRXJyb3IsIHJlcyA6IHN0cmluZykgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogY2hhbmdlUGFzc3dvcmQgLT4gY2hhbmdlUGFzc3dvcmQnLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IEFkbWluIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBhZG1pbkNyZWF0ZVVzZXIodXNlcm5hbWUgOiBzdHJpbmcsIHBhc3N3b3JkIDogc3RyaW5nKSA6IFByb21pc2U8QVdTLkFXU0Vycm9yIHwgQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pbkNyZWF0ZVVzZXJSZXNwb25zZT5cbiAge1xuICAgIHRoaXMuc2V0QWRtaW4oKTtcbiAgICBsZXQgcGFyYW1zIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pbkNyZWF0ZVVzZXJSZXF1ZXN0ID0ge1xuICAgICAgVXNlclBvb2xJZCAgICAgICAgOiB0aGlzLnBvb2xEYXRhLlVzZXJQb29sSWQsXG4gICAgICBVc2VybmFtZSAgICAgICAgICA6IHVzZXJuYW1lLFxuICAgICAgVGVtcG9yYXJ5UGFzc3dvcmQgOiBwYXNzd29yZFxuICAgIH07XG5cbiAgICBsZXQgY29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyID0gbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5hZG1pbkNyZWF0ZVVzZXIocGFyYW1zLCAoZXJyIDogQVdTLkFXU0Vycm9yLCByZXMgOiBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluQ3JlYXRlVXNlclJlc3BvbnNlKSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogYWRtaW5DcmVhdGVVc2VyIC0+IGFkbWluQ3JlYXRlVXNlcicsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFkbWluRGVsZXRlVXNlcih1c2VybmFtZSA6IHN0cmluZykgOiBQcm9taXNlPEFXUy5BV1NFcnJvciB8IGFueT5cbiAge1xuICAgIHRoaXMuc2V0QWRtaW4oKTtcbiAgICBsZXQgcGFyYW1zIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pbkRlbGV0ZVVzZXJSZXF1ZXN0ID0ge1xuICAgICAgVXNlclBvb2xJZCA6IHRoaXMucG9vbERhdGEuVXNlclBvb2xJZCxcbiAgICAgIFVzZXJuYW1lICAgOiB1c2VybmFtZVxuICAgIH07XG5cbiAgICBsZXQgY29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyID0gbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5hZG1pbkRlbGV0ZVVzZXIocGFyYW1zLCAoZXJyIDogQVdTLkFXU0Vycm9yLCByZXMgOiBhbnkpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChyZXMpXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBhZG1pbkRlbGV0ZVVzZXIgLT4gYWRtaW5EZWxldGVVc2VyJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYWRtaW5SZXNldFVzZXJQYXNzd29yZCh1c2VybmFtZSA6IHN0cmluZykgOiBQcm9taXNlPEFXUy5BV1NFcnJvciB8IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5SZXNldFVzZXJQYXNzd29yZFJlc3BvbnNlPlxuICB7XG4gICAgdGhpcy5zZXRBZG1pbigpO1xuICAgIGxldCBwYXJhbXMgOiBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluUmVzZXRVc2VyUGFzc3dvcmRSZXF1ZXN0ID0ge1xuICAgICAgVXNlclBvb2xJZCA6IHRoaXMucG9vbERhdGEuVXNlclBvb2xJZCxcbiAgICAgIFVzZXJuYW1lICAgOiB1c2VybmFtZVxuICAgIH07XG5cbiAgICBsZXQgY29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyID0gbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5hZG1pblJlc2V0VXNlclBhc3N3b3JkKHBhcmFtcywgKGVyciA6IEFXUy5BV1NFcnJvciwgcmVzIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pblJlc2V0VXNlclBhc3N3b3JkUmVzcG9uc2UpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChyZXMpXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBhZG1pblJlc2V0VXNlclBhc3N3b3JkIC0+IGFkbWluUmVzZXRVc2VyUGFzc3dvcmQnLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzKHVzZXJuYW1lIDogc3RyaW5nLCB1c2VyQXR0cmlidXRlcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuVHlwZXMuQXR0cmlidXRlTGlzdFR5cGUpIDogUHJvbWlzZTxBV1MuQVdTRXJyb3IgfCBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXNSZXNwb25zZT5cbiAge1xuICAgIHRoaXMuc2V0QWRtaW4oKTtcbiAgICBsZXQgcGFyYW1zIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzUmVxdWVzdCA9IHtcbiAgICAgIFVzZXJQb29sSWQgICAgIDogdGhpcy5wb29sRGF0YS5Vc2VyUG9vbElkLFxuICAgICAgVXNlcm5hbWUgICAgICAgOiB1c2VybmFtZSxcbiAgICAgIFVzZXJBdHRyaWJ1dGVzIDogdXNlckF0dHJpYnV0ZXNcbiAgICB9O1xuXG4gICAgbGV0IGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlciA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuYWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcyhwYXJhbXMsIChlcnIgOiBBV1MuQVdTRXJyb3IsIHJlcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlc1Jlc3BvbnNlKSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogYWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcyAtPiBhZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcmVzZXRFeHBpcmVkQWNjb3VudCh1c2VybmFtZUtleSA6IHN0cmluZywgdXNlcm5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxBV1MuQVdTRXJyb3IgfCBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXNSZXNwb25zZT5cbiAge1xuICAgIGxldCBhdHRyaWJ1dGVzIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BdHRyaWJ1dGVUeXBlW10gPSBbXTtcbiAgICBhdHRyaWJ1dGVzLnB1c2goeyBOYW1lIDogdXNlcm5hbWVLZXksIFZhbHVlIDogdXNlcm5hbWUgfSk7XG4gICAgcmV0dXJuIHRoaXMuYWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcyh1c2VybmFtZSwgYXR0cmlidXRlcyk7XG4gIH1cblxuICBwdWJsaWMgc2V0QWRtaW4oKSA6IHZvaWRcbiAge1xuICAgIGxldCBjcmVkcyA9IG5ldyBBV1MuQ3JlZGVudGlhbHModGhpcy5hZG1pbkFjY2Vzc0tleUlkLCB0aGlzLmFkbWluU2VjcmV0S2V5SWQpO1xuICAgIEFXUy5jb25maWcucmVnaW9uICAgICAgPSB0aGlzLnJlZ2lvbjtcbiAgICBBV1MuY29uZmlnLmNyZWRlbnRpYWxzID0gY3JlZHM7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogQXV0aGVudGljYXRpb24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbm5lY3QgYW4gZXhpc3RpbmcgdXNlclxuICAgKlxuICAgKiBAcGFyYW0gcHJvdmlkZXIgLSBVc2UgdGhlIEF1dGhUeXBlIGVudW0gdG8gc2VuZCBhbiBhdXRob3JpemVkIGF1dGhlbnRpY2F0aW9uIHByb3ZpZGVyXG4gICAqIEBwYXJhbSB1c2VybmFtZVxuICAgKiBAcGFyYW0gcGFzc3dvcmRcbiAgICovXG4gIHB1YmxpYyBzaWduSW4ocHJvdmlkZXIgOiBzdHJpbmcsIHVzZXJuYW1lID86IHN0cmluZywgcGFzc3dvcmQgPzogc3RyaW5nKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIHN3aXRjaCAocHJvdmlkZXIpXG4gICAge1xuICAgICAgY2FzZSBBdXRoVHlwZS5DT0dOSVRPIDpcbiAgICAgICAgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlQ29nbml0b1VzZXIodXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICAgIGNhc2UgQXV0aFR5cGUuR09PR0xFIDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbEdvb2dsZShHb29nbGVBY3Rpb24uQVVUSEVOVElDQVRFKTtcbiAgICAgIGRlZmF1bHQgOlxuICAgICAgICBsZXQgZXJyb3IgPSAnUHJvdmlkZXIgbm90IHJlY29nbml6ZWQgOiB1c2UgdGhlIEF1dGhUeXBlIGVudW0gdG8gc2VuZCBhbiBhdXRob3JpemVkIGF1dGhlbnRpY2F0aW9uIHByb3ZpZGVyJztcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlc3BvbnNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaCBhIHVzZXIncyBzZXNzaW9uIChyZXRyaWV2ZSByZWZyZXNoZWQgdG9rZW5zKVxuICAgKi9cbiAgcHVibGljIHJlZnJlc2hTZXNzaW9uKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgcHJvdmlkZXIgOiBzdHJpbmcgPSBudWxsO1xuICAgIHByb3ZpZGVyID0gdGhpcy5nZXRQcm92aWRlcigpO1xuXG4gICAgc3dpdGNoIChwcm92aWRlcilcbiAgICB7XG4gICAgICBjYXNlIEF1dGhUeXBlLkNPR05JVE8gOlxuICAgICAgICByZXR1cm4gdGhpcy5yZWZyZXNoQ29nbml0b1Nlc3Npb24oKTtcbiAgICAgIGNhc2UgQXV0aFR5cGUuR09PR0xFIDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbEdvb2dsZShHb29nbGVBY3Rpb24uUkVGUkVTSCk7XG4gICAgICBkZWZhdWx0IDpcbiAgICAgICAgbGV0IGVycm9yID0gJ1Byb3ZpZGVyIG5vdCByZWNvZ25pemVkIDogdGhlIHVzZXIgbXVzdCBiZSBsb2dnZWQgaW4gYmVmb3JlIHVwZGF0aW5nIHRoZSBzZXNzaW9uJztcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlc3BvbnNlKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2lnbk91dCgpIDogdm9pZFxuICB7XG4gICAgbGV0IHByb3ZpZGVyIDogc3RyaW5nID0gbnVsbDtcbiAgICBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIoKTtcblxuICAgIHN3aXRjaCAocHJvdmlkZXIpXG4gICAge1xuICAgICAgY2FzZSBBdXRoVHlwZS5DT0dOSVRPIDpcbiAgICAgICAgdGhpcy5zaWduT3V0Q29nbml0bygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQXV0aFR5cGUuR09PR0xFIDpcbiAgICAgICAgdGhpcy5jYWxsR29vZ2xlKEdvb2dsZUFjdGlvbi5MT0dPVVQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQgOlxuICAgICAgICBjb25zb2xlLmVycm9yKCdQcm92aWRlciBub3QgcmVjb2duaXplZCA6IHRoZSB1c2VyIG11c3QgYmUgbG9nZ2VkIGluIGJlZm9yZSBsb2dnaW5nIG91dCcpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0aGlzLm9uU2lnbk91dC5lbWl0KCk7XG4gICAgdGhpcy5jbGVhclN0b3JhZ2UoKTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBDb2duaXRvIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcml2YXRlIGF1dGhlbnRpY2F0ZUNvZ25pdG9Vc2VyKHVzZXJuYW1lIDogc3RyaW5nLCBwYXNzd29yZCA6IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgYXV0aGVudGljYXRpb25EYXRhIDogQVdTQ29nbml0by5JQXV0aGVudGljYXRpb25EZXRhaWxzRGF0YSA9IHtcbiAgICAgIFVzZXJuYW1lIDogdXNlcm5hbWUsXG4gICAgICBQYXNzd29yZCA6IHBhc3N3b3JkXG4gICAgfTtcbiAgICBsZXQgYXV0aGVudGljYXRpb25EZXRhaWxzID0gbmV3IEFXU0NvZ25pdG8uQXV0aGVudGljYXRpb25EZXRhaWxzKGF1dGhlbnRpY2F0aW9uRGF0YSk7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcih1c2VybmFtZSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5hdXRoZW50aWNhdGVVc2VyKGF1dGhlbnRpY2F0aW9uRGV0YWlscyxcbiAgICAgIHtcbiAgICAgICAgbmV3UGFzc3dvcmRSZXF1aXJlZCA6ICh1c2VyQXR0cmlidXRlcyA6IGFueSwgcmVxdWlyZWRBdHRyaWJ1dGVzIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5jb2duaXRvVXNlciA9IGNvZ25pdG9Vc2VyOyAvLyBOT1RFOiBodHRwczovL2dpdGh1Yi5jb20vYW1hem9uLWFyY2hpdmVzL2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzL2lzc3Vlcy8zNjVcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5ORVdfUEFTU1dPUkRfUkVRVUlSRUQsIHsgdXNlckF0dHJpYnV0ZXMgOiB1c2VyQXR0cmlidXRlcywgcmVxdWlyZWRBdHRyaWJ1dGVzIDogcmVxdWlyZWRBdHRyaWJ1dGVzIH0pO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25TdWNjZXNzIDogKHNlc3Npb24gOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyU2Vzc2lvbikgPT5cbiAgICAgICAge1xuICAgICAgICAgIHRoaXMuc2V0VXNlcm5hbWUodXNlcm5hbWUpO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9rZW5zKHNlc3Npb24pO1xuICAgICAgICAgIHRoaXMuc2V0UHJvdmlkZXIoQXV0aFR5cGUuQ09HTklUTyk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDcmVkZW50aWFscygpO1xuXG4gICAgICAgICAgdGhpcy5vblNpZ25Jbi5lbWl0KCk7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgc2Vzc2lvbik7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBvbkZhaWx1cmUgOiAoZXJyKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBhdXRoZW50aWNhdGVDb2duaXRvVXNlciAtPiBhdXRoZW50aWNhdGVVc2VyJywgZXJyKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBtZmFTZXR1cCA6IChjaGFsbGVuZ2VOYW1lIDogYW55LCBjaGFsbGVuZ2VQYXJhbWV0ZXJzIDogYW55KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgY29nbml0b1VzZXIuYXNzb2NpYXRlU29mdHdhcmVUb2tlbihcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhc3NvY2lhdGVTZWNyZXRDb2RlIDogKHNlY3JldENvZGUgOiBzdHJpbmcpID0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk1GQV9TRVRVUF9BU1NPQ0lBVEVfU0VDUkVURV9DT0RFLCBzZWNyZXRDb2RlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRmFpbHVyZSA6IChlcnIpID0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk1GQV9TRVRVUF9PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbWZhUmVxdWlyZWQgOiAoY2hhbGxlbmdlTmFtZSA6IGFueSwgY2hhbGxlbmdlUGFyYW1ldGVycyA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk1GQV9SRVFVSVJFRCwgeyBjaGFsbGVuZ2VOYW1lIDogY2hhbGxlbmdlTmFtZSwgY2hhbGxlbmdlUGFyYW1ldGVycyA6IGNoYWxsZW5nZVBhcmFtZXRlcnMgfSk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaENvZ25pdG9TZXNzaW9uKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgdG9rZW5zICAgICAgID0gdGhpcy5nZXRUb2tlbnMoKTtcbiAgICBsZXQgY29nbml0b1VzZXIgID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuICAgIGxldCByZWZyZXNoVG9rZW4gPSBuZXcgQVdTQ29nbml0by5Db2duaXRvUmVmcmVzaFRva2VuKHsgUmVmcmVzaFRva2VuIDogdG9rZW5zLnJlZnJlc2hUb2tlbiB9KTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLnJlZnJlc2hTZXNzaW9uKHJlZnJlc2hUb2tlbiwgKGVyciA6IGFueSwgcmVzIDogYW55KSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy51cGRhdGVUb2tlbnMocmVzKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNyZWRlbnRpYWxzKCk7XG5cbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHJlZnJlc2hTZXNzaW9uIC0+IHJlZnJlc2hTZXNzaW9uJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2lnbk91dENvZ25pdG8oKSA6IHZvaWRcbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICBpZiAoY29nbml0b1VzZXIpXG4gICAgICBjb2duaXRvVXNlci5zaWduT3V0KCk7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogR29vZ2xlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBpbml0R29vZ2xlKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgcGFyYW1zICA6IGdhcGkuYXV0aDIuQ2xpZW50Q29uZmlnID0ge1xuICAgICAgY2xpZW50X2lkIDogdGhpcy5nb29nbGVJZCxcbiAgICAgIHNjb3BlICAgICA6IHRoaXMuZ29vZ2xlU2NvcGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgZ2FwaS5sb2FkKCdhdXRoMicsXG4gICAgICB7XG4gICAgICAgIGNhbGxiYWNrICA6IF8gPT5cbiAgICAgICAge1xuICAgICAgICAgIGdhcGkuYXV0aDIuaW5pdChwYXJhbXMpLnRoZW4oKGdvb2dsZUF1dGggOiBnYXBpLmF1dGgyLkdvb2dsZUF1dGgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5nb29nbGVBdXRoID0gZ29vZ2xlQXV0aDtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIGdvb2dsZUF1dGgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHJlYXNvbiA6IHsgZXJyb3IgOiBzdHJpbmcsIGRldGFpbHMgOiBzdHJpbmcgfSkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGluaXRHb29nbGUgLT4gR29vZ2xlQXV0aCcsIHJlYXNvbik7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCByZWFzb24pO1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uZXJyb3IgICA6IF8gPT5cbiAgICAgICAgeyAvLyBIYW5kbGUgbG9hZGluZyBlcnJvclxuICAgICAgICAgIGxldCBlcnJvciA9ICdnYXBpLmNsaWVudCBmYWlsZWQgdG8gbG9hZCc7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBpbml0R29vZ2xlIC0+IGxvYWQnLCBlcnJvcik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRVJST1IsIGVycm9yKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dCAgIDogNTAwMCwgLy8gNSBzZWNvbmRzXG4gICAgICAgIG9udGltZW91dCA6IF8gPT5cbiAgICAgICAgeyAvLyBIYW5kbGUgdGltZW91dFxuICAgICAgICAgIGxldCBlcnJvciA9ICdnYXBpLmNsaWVudCBjb3VsZCBub3QgbG9hZCBpbiBhIHRpbWVseSBtYW5uZXInO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogaW5pdEdvb2dsZSAtPiBsb2FkJywgZXJyb3IpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1RJTUVPVVQsIGVycm9yKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGxHb29nbGUoYWN0aW9uIDogc3RyaW5nKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGlmICh0aGlzLmdvb2dsZUF1dGgpXG4gICAge1xuICAgICAgcmV0dXJuIHRoaXMubWFrZUdvb2dsZShhY3Rpb24pO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICB7XG4gICAgICAgIHRoaXMuaW5pdEdvb2dsZSgpLnRoZW4oXyA9PlxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5tYWtlR29vZ2xlKGFjdGlvbikudGhlbihyZXMgPT4gcmVzb2x2ZShyZXMpKS5jYXRjaChlcnIgPT4gcmVqZWN0KGVycikpO1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyb3IpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYWtlR29vZ2xlKGFjdGlvbiA6IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBzd2l0Y2ggKGFjdGlvbilcbiAgICB7XG4gICAgICBjYXNlIEdvb2dsZUFjdGlvbi5BVVRIRU5USUNBVEUgOlxuICAgICAgICByZXR1cm4gdGhpcy5hdXRoZW50aWNhdGVHb29nbGVVc2VyKCk7XG4gICAgICBjYXNlIEdvb2dsZUFjdGlvbi5SRUZSRVNIIDpcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmcmVzaEdvb2dsZVNlc3Npb24oKTtcbiAgICAgIGNhc2UgR29vZ2xlQWN0aW9uLkxPR09VVCA6XG4gICAgICAgIHRoaXMuc2lnbk91dEdvb2dsZSgpO1xuICAgICAgICBsZXQgbG9nb3V0UmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShsb2dvdXRSZXNwb25zZSk7XG4gICAgICBkZWZhdWx0IDpcbiAgICAgICAgbGV0IGVycm9yID0gJ0dvb2dsZSBhY3Rpb24gbm90IHJlY29nbml6ZWQgOiBhdXRoZW50aWNhdGUgLyByZWZyZXNoIC8gbG9nb3V0JztcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGxldCBkZWZhdWx0UmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChkZWZhdWx0UmVzcG9uc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXV0aGVudGljYXRlR29vZ2xlVXNlcigpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgbGV0IG9wdGlvbnMgOiBnYXBpLmF1dGgyLlNpZ25pbk9wdGlvbnMgPSB7XG4gICAgICAgIHNjb3BlIDogdGhpcy5nb29nbGVTY29wZVxuICAgICAgfTtcbiAgICAgIHRoaXMuZ29vZ2xlQXV0aC5zaWduSW4ob3B0aW9ucykudGhlbigoZ29vZ2xlVXNlciA6IGdhcGkuYXV0aDIuR29vZ2xlVXNlcikgPT5cbiAgICAgIHtcbiAgICAgICAgbGV0IGdvb2dsZVJlc3BvbnNlID0gZ29vZ2xlVXNlci5nZXRBdXRoUmVzcG9uc2UoKTtcbiAgICAgICAgbGV0IGdvb2dsZVByb2ZpbGUgID0gZ29vZ2xlVXNlci5nZXRCYXNpY1Byb2ZpbGUoKTtcblxuICAgICAgICB0aGlzLnNldFVzZXJuYW1lKGdvb2dsZVByb2ZpbGUuZ2V0TmFtZSgpKTtcbiAgICAgICAgdGhpcy5zZXRJZFRva2VuKGdvb2dsZVJlc3BvbnNlLmlkX3Rva2VuKTtcbiAgICAgICAgdGhpcy5zZXRFeHBpcmVzQXQoZ29vZ2xlUmVzcG9uc2UuZXhwaXJlc19hdCk7XG4gICAgICAgIHRoaXMuc2V0UHJvdmlkZXIoQXV0aFR5cGUuR09PR0xFKTtcbiAgICAgICAgdGhpcy51cGRhdGVDcmVkZW50aWFscygpO1xuXG4gICAgICAgIHRoaXMub25TaWduSW4uZW1pdCgpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBnb29nbGVQcm9maWxlKTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgfSwgKG9uUmVqZWN0ZWQgOiBhbnkpID0+XG4gICAgICB7XG4gICAgICAgIC8vIENhbiBiZSA6IHBvcHVwX2Jsb2NrZWRfYnlfYnJvd3NlclxuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGF1dGhlbnRpY2F0ZUdvb2dsZVVzZXIgLT4gc2lnbkluJywgb25SZWplY3RlZCk7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1JFSkVDVEVELCBvblJlamVjdGVkKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PlxuICAgICAge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGF1dGhlbnRpY2F0ZUdvb2dsZVVzZXIgLT4gc2lnbkluJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaEdvb2dsZVNlc3Npb24oKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBnb29nbGVVc2VyIDogZ2FwaS5hdXRoMi5Hb29nbGVVc2VyID0gbnVsbDtcbiAgICBnb29nbGVVc2VyID0gdGhpcy5nb29nbGVBdXRoLmN1cnJlbnRVc2VyLmdldCgpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgZ29vZ2xlVXNlci5yZWxvYWRBdXRoUmVzcG9uc2UoKS50aGVuKChyZXMgOiBnYXBpLmF1dGgyLkF1dGhSZXNwb25zZSkgPT5cbiAgICAgIHtcbiAgICAgICAgdGhpcy5zZXRJZFRva2VuKHJlcy5pZF90b2tlbik7XG4gICAgICAgIHRoaXMuc2V0RXhwaXJlc0F0KHJlcy5leHBpcmVzX2F0KTtcbiAgICAgICAgdGhpcy51cGRhdGVDcmVkZW50aWFscygpO1xuXG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PlxuICAgICAge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHJlZnJlc2hHb29nbGVTZXNzaW9uIC0+IHJlbG9hZEF1dGhSZXNwb25zZScsIGVycik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNpZ25PdXRHb29nbGUoKSA6IHZvaWRcbiAge1xuICAgIHRoaXMuZ29vZ2xlQXV0aC5zaWduT3V0KCkudGhlbihfID0+XG4gICAge1xuICAgICAgdGhpcy5nb29nbGVBdXRoLmRpc2Nvbm5lY3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBUT0RPOiBGYWNlYm9vayAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IFByaXZhdGUgaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIE5PVEU6IFVzZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcml2YXRlIHNldENvZ25pdG9Vc2VyKHVzZXJuYW1lIDogc3RyaW5nKSA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJcbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXIgPSBudWxsO1xuICAgIGxldCBjb2duaXRvVXNlclBvb2wgPSBuZXcgQVdTQ29nbml0by5Db2duaXRvVXNlclBvb2wodGhpcy5wb29sRGF0YSk7XG5cbiAgICBsZXQgdXNlckRhdGEgOiBBV1NDb2duaXRvLklDb2duaXRvVXNlckRhdGEgPSB7XG4gICAgICBVc2VybmFtZSAgIDogdXNlcm5hbWUsXG4gICAgICBQb29sICAgICAgIDogY29nbml0b1VzZXJQb29sXG4gICAgfTtcbiAgICBjb2duaXRvVXNlciA9IG5ldyBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyKHVzZXJEYXRhKTtcblxuICAgIHRoaXMuY29nbml0b1VzZXIgPSBjb2duaXRvVXNlcjsgLy8gU3RvcmUgdGhlIHVzZXIgaW4gdGhlIHNlcnZpY2VcbiAgICB0aGlzLnNldFVzZXJuYW1lKHVzZXJuYW1lKTsgLy8gU3RvcmUgdGhlIHVzZXJuYW1lIGluIHRoZSBsb2NhbCBzdG9yYWdlXG5cbiAgICByZXR1cm4gY29nbml0b1VzZXI7XG4gIH1cblxuICAvLyBOT1RFOiBTZXNzaW9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBzZXRFeHBpcmVzQXQoZXhwaXJlc0F0IDogbnVtYmVyKSA6IHZvaWRcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ0V4cGlyZXNBdCc7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgZXhwaXJlc0F0LnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgLy8gTk9URTogVXNlcm5hbWUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByaXZhdGUgc2V0VXNlcm5hbWUodXNlcm5hbWUgOiBzdHJpbmcpIDogdm9pZFxuICB7XG4gICAgbGV0IHN0b3JhZ2VLZXkgOiBzdHJpbmcgPSBudWxsO1xuICAgIHN0b3JhZ2VLZXkgPSB0aGlzLnN0b3JhZ2VQcmVmaXggKyAnVXNlcm5hbWUnO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIHVzZXJuYW1lKTtcbiAgfVxuXG4gIC8vIE5PVEU6IFByb3ZpZGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcml2YXRlIHNldFByb3ZpZGVyKHByb3ZpZGVyIDogc3RyaW5nKSA6IHZvaWRcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Byb3ZpZGVyJztcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCBwcm92aWRlcik7XG4gIH1cblxuICAvLyBOT1RFOiBUb2tlbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBzZXRJZFRva2VuKHRva2VuIDogc3RyaW5nKSA6IHZvaWRcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ0lkVG9rZW4nO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIHRva2VuKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0VG9rZW5zKHNlc3Npb24gOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyU2Vzc2lvbikgOiB2b2lkXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IHRva2Vuc1N0ciAgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCB0b2tlbnNPYmogIDogYW55ICAgID0gbnVsbDtcblxuICAgIHN0b3JhZ2VLZXkgPSB0aGlzLnN0b3JhZ2VQcmVmaXggKyAnU2Vzc2lvblRva2Vucyc7XG4gICAgdG9rZW5zT2JqICA9IHtcbiAgICAgIGFjY2Vzc1Rva2VuICAgICAgICAgIDogc2Vzc2lvbi5nZXRBY2Nlc3NUb2tlbigpLmdldEp3dFRva2VuKCksXG4gICAgICBhY2Nlc3NUb2tlbkV4cGlyZXNBdCA6IHNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRFeHBpcmF0aW9uKCkgKiAxMDAwLCAvLyBTZWNvbmRzIHRvIG1pbGxpc2Vjb25kc1xuICAgICAgaWRUb2tlbiAgICAgICAgICAgICAgOiBzZXNzaW9uLmdldElkVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgaWRUb2tlbkV4cGlyZXNBdCAgICAgOiBzZXNzaW9uLmdldElkVG9rZW4oKS5nZXRFeHBpcmF0aW9uKCkgKiAxMDAwLCAvLyBTZWNvbmRzIHRvIG1pbGxpc2Vjb25kc1xuICAgICAgcmVmcmVzaFRva2VuICAgICAgICAgOiBzZXNzaW9uLmdldFJlZnJlc2hUb2tlbigpLmdldFRva2VuKClcbiAgICB9O1xuICAgIHRva2Vuc1N0ciA9IEpTT04uc3RyaW5naWZ5KHRva2Vuc09iaik7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgdG9rZW5zU3RyKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlVG9rZW5zKHNlc3Npb24gOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyU2Vzc2lvbikgOiB2b2lkXG4gIHtcbiAgICBsZXQgdG9rZW5zIDogYW55ID0gbnVsbDtcbiAgICB0aGlzLnNldFRva2VucyhzZXNzaW9uKTtcbiAgICB0b2tlbnMgPSB0aGlzLmdldFRva2VucygpO1xuICAgIHRoaXMuc2V0SWRUb2tlbih0b2tlbnMuaWRUb2tlbik7XG4gICAgdGhpcy5zZXRFeHBpcmVzQXQodG9rZW5zLmlkVG9rZW5FeHBpcmVzQXQpO1xuICB9XG5cbiAgLy8gTk9URTogU3RvcmFnZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByaXZhdGUgY2xlYXJTdG9yYWdlKCkgOiB2b2lkXG4gIHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnN0b3JhZ2VQcmVmaXggKyAnVXNlcm5hbWUnKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnN0b3JhZ2VQcmVmaXggKyAnUHJvdmlkZXInKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnN0b3JhZ2VQcmVmaXggKyAnSWRUb2tlbicpO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuc3RvcmFnZVByZWZpeCArICdFeHBpcmVzQXQnKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnN0b3JhZ2VQcmVmaXggKyAnU2Vzc2lvblRva2VucycpO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxufVxuIl19
