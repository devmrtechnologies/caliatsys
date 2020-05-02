(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('amazon-cognito-identity-js'), require('aws-sdk')) :
        typeof define === 'function' && define.amd ? define('@caliatys/cognito-service', ['exports', '@angular/core', 'amazon-cognito-identity-js', 'aws-sdk'], factory) :
        (factory((global.caliatys = global.caliatys || {}, global.caliatys['cognito-service'] = {}), global.ng.core, global.AWSCognito, global.AWS));
}(this, (function(exports, i0, AWSCognito, AWS) {
    'use strict';

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */
    var CognitoServiceResponse = /** @class */ (function() {
        function CognitoServiceResponse(type, data) {
            this.type = type;
            this.data = data;
        }
        return CognitoServiceResponse;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */
    /** @enum {string} */
    var AuthType = {
        COGNITO: 'cognito',
        GOOGLE: 'google',
        FACEBOOK: 'facebook',
    };

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */
    /** @enum {string} */
    var RespType = {
        ON_SUCCESS: 'onSuccess',
        ON_FAILURE: 'onFailure',
        ON_ERROR: 'onError',
        ON_TIMEOUT: 'onTimeout',
        ON_REJECTED: 'onRejected',
        NEW_PASSWORD_REQUIRED: 'newPasswordRequired',
        INPUT_VERIFICATION_CODE: 'inputVerificationCode',
        MFA_REQUIRED: 'mfaRequired',
        MFA_SETUP_ASSOCIATE_SECRETE_CODE: 'mfaSetup associateSecretCode',
        MFA_SETUP_ON_FAILURE: 'mfaSetup onFailure',
        EXPIRED_TOKEN: 'expiredToken',
    };

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */
    /** @enum {string} */
    var GoogleAction = {
        AUTHENTICATE: 'authenticate',
        REFRESH: 'refresh',
        LOGOUT: 'logout',
    };
    var CognitoService = /** @class */ (function() {
        function CognitoService(cognitoConst) {
            this.cognitoConst = cognitoConst;
            this.poolData = {
                UserPoolId: null,
                // CognitoUserPool
                ClientId: null // CognitoUserPoolClient
            };
            this.onSignIn = new i0.EventEmitter();
            this.onSignOut = new i0.EventEmitter();
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
            function(username, password, email, offerId, clientId, firstName, lastName, onlineUser, resubmission) {
                this.setAdmin();
                /** @type {?} */

                var params = {
                    UserPoolId: this.poolData.UserPoolId,
                    Username: username,
                    TemporaryPassword: password,
                    UserAttributes: [{
                            "Name": "email",
                            "Value": email
                        },
                        {
                            "Name": "custom:offerno",
                            "Value": offerId
                        },
                        {
                            "Name": "custom:clientId",
                            "Value": clientId
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
                            "Name": "custom:onlineUser",
                            "Value": onlineUser
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
            type: i0.Injectable,
            args: [{
                providedIn: 'root'
            }, ]
        }];
        /** @nocollapse */
        CognitoService.ctorParameters = function() {
            return [{
                type: undefined,
                decorators: [{
                    type: i0.Inject,
                    args: ['cognitoConst', ]
                }, {
                    type: i0.Optional
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

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
     */

    exports.CognitoServiceResponse = CognitoServiceResponse;
    exports.AuthType = AuthType;
    exports.RespType = RespType;
    exports.GoogleAction = GoogleAction;
    exports.CognitoService = CognitoService;

    Object.defineProperty(exports, '__esModule', {
        value: true
    });

})));

//# sourceMappingURL=caliatys-cognito-service.umd.js.map