import {
    Injectable,
    Inject,
    Optional,
    EventEmitter,
    defineInjectable,
    inject
} from '@angular/core';
import {
    CognitoUserPool,
    AuthenticationDetails,
    CognitoRefreshToken,
    CognitoUser
} from 'amazon-cognito-identity-js';
import {
    STS,
    config,
    CognitoIdentityCredentials,
    CognitoIdentityServiceProvider,
    Credentials
} from 'aws-sdk';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class CognitoServiceResponse {
    /**
     * @param {?} type
     * @param {?} data
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @enum {string} */
const AuthType = {
    COGNITO: 'cognito',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @enum {string} */
const RespType = {
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
const GoogleAction = {
    AUTHENTICATE: 'authenticate',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
};
class CognitoService {
    /**
     * @param {?} cognitoConst
     */
    constructor(cognitoConst) {
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
    /**
     * @return {?}
     */
    isAuthenticated() {
        if (this.getRemaining())
            return true;
        return false;
    }
    /**
     * @return {?}
     */
    sts() {
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                /** @type {?} */
                let sts = new STS();
                /** @type {?} */
                let params = null;
                sts.getCallerIdentity(params, (
                    /**
                     * @param {?} err
                     * @param {?} data
                     * @return {?}
                     */
                    (err, data) => {
                        if (data)
                            return resolve(data);
                        console.error('CognitoService : sts -> getCallerIdentity', err);
                        return reject(err);
                    }));
            }));
    }
    // NOTE: Session -----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    autoRefreshSession() {
        /** @type {?} */
        let expiresAt = this.getExpiresAt();
        if (!expiresAt)
            return;
        /** @type {?} */
        let timeDiff = expiresAt.getTime() - Date.now() - 60000;
        if (timeDiff < 0) {
            this.signOut();
            return;
        }
        setTimeout((
            /**
             * @return {?}
             */
            () => {
                // Refresh token
                this.refreshSession()
                    .then((
                        /**
                         * @param {?} _
                         * @return {?}
                         */
                        _ => {
                            this.autoRefreshSession();
                        }))
                    .catch((
                        /**
                         * @param {?} _
                         * @return {?}
                         */
                        _ => {
                            this.signOut();
                        }));
            }), timeDiff);
    }
    /**
     * @return {?}
     */
    getRemaining() {
        /** @type {?} */
        let remaining = 0;
        /** @type {?} */
        let now = 0;
        /** @type {?} */
        let max = null;
        now = Date.now();
        max = this.getExpiresAt();
        if (!max)
            return null;
        remaining = max.getTime() - now;
        if (remaining <= 0)
            return null;
        return remaining;
    }
    /**
     * @return {?}
     */
    getExpiresAt() {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let expiresAtStr = null;
        /** @type {?} */
        let expiresAtNum = null;
        /** @type {?} */
        let expiresAtDat = null;
        storageKey = this.storagePrefix + 'ExpiresAt';
        expiresAtStr = localStorage.getItem(storageKey);
        if (expiresAtStr) {
            expiresAtNum = Number(expiresAtStr);
            if (expiresAtNum)
                expiresAtDat = new Date(expiresAtNum);
        }
        return expiresAtDat;
    }
    // NOTE: Username ----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    getUsername() {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let provider = null;
        storageKey = this.storagePrefix + 'Username';
        provider = localStorage.getItem(storageKey);
        return provider;
    }
    // NOTE: Provider ----------------------------------------------------------------------------
    /**
     * @return {?}
     */
    getProvider() {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let provider = null;
        storageKey = this.storagePrefix + 'Provider';
        provider = localStorage.getItem(storageKey);
        return provider;
    }
    // NOTE: Token -------------------------------------------------------------------------------
    /**
     * @return {?}
     */
    getIdToken() {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let idToken = null;
        storageKey = this.storagePrefix + 'IdToken';
        idToken = localStorage.getItem(storageKey);
        return idToken;
    }
    /**
     * @return {?}
     */
    getTokens() {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let tokensStr = null;
        /** @type {?} */
        let tokensObj = null;
        storageKey = this.storagePrefix + 'SessionTokens';
        tokensStr = localStorage.getItem(storageKey);
        tokensObj = JSON.parse(tokensStr);
        return tokensObj;
    }
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Credentials ----------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @return {?}
     */
    initCredentials() {
        config.credentials = new CognitoIdentityCredentials({
            IdentityPoolId: this.identityPool,
        });
        config.region = this.region;
    }
    /**
     * @return {?}
     */
    getCredentials() {
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                /** @type {?} */
                let credentials = ( /** @type {?} */ (config.credentials));
                if (!credentials) {
                    /** @type {?} */
                    let error = 'You must initialize the credentials with initCredentials()';
                    console.error('CognitoService : getCredentials', error);
                    return reject(error);
                }
                credentials.get((
                    /**
                     * @param {?} err
                     * @return {?}
                     */
                    (err) => {
                        if (err) {
                            console.error('CognitoService : getCredentials', err);
                            return reject(err);
                        }
                        return resolve(config.credentials);
                    }));
            }));
    }
    /**
     * @param {?=} clientConfig
     * @return {?}
     */
    updateCredentials(clientConfig) {
        /** @type {?} */
        let url = null;
        /** @type {?} */
        let provider = null;
        /** @type {?} */
        let idToken = null;
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
        let logins = {};
        logins[url] = idToken;
        if (!this.identityPool) {
            console.info('We recommend that you provide an identity pool ID from a federated identity');
            return;
        }
        /** @type {?} */
        let options = {
            IdentityPoolId: this.identityPool,
            Logins: logins
        };
        config.region = this.region;
        config.credentials = new CognitoIdentityCredentials(options, clientConfig);
    }
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: User -----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @param {?=} username
     * @return {?}
     */
    getCognitoUser(username = null) {
        if (this.cognitoUser)
            return this.cognitoUser; // User stored in the service
        // User stored in the service
        /** @type {?} */
        let cognitoUser = null;
        /** @type {?} */
        let cognitoUserPool = new CognitoUserPool(this.poolData);
        cognitoUser = cognitoUserPool.getCurrentUser(); // Authenticated user
        if (!cognitoUser) {
            /** @type {?} */
            let name = null;
            if (username)
                name = username; // User sent
            else
                name = this.getUsername(); // User stored in local storage
            cognitoUser = this.setCognitoUser(name);
        }
        return cognitoUser;
    }
    /**
     * @return {?}
     */
    getUserAttributes() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        cognitoUser.getUserAttributes((
            /**
             * @param {?} err
             * @param {?} res
             * @return {?}
             */
            (err, res) => {
                if (res)
                    return res;
                console.error('CognitoService : getUserAttributes -> getUserAttributes', err);
            }));
    }
    /**
     * @param {?} attributeList
     * @return {?}
     */
    deleteAttributes(attributeList) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        cognitoUser.deleteAttributes(attributeList, (
            /**
             * @param {?} err
             * @param {?} res
             * @return {?}
             */
            (err, res) => {
                if (res)
                    return res;
                console.error('CognitoService : deleteAttributes -> deleteAttributes', err);
            }));
    }
    /**
     * @return {?}
     */
    getUserData() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        cognitoUser.getUserData((
            /**
             * @param {?} err
             * @param {?} res
             * @return {?}
             */
            (err, res) => {
                if (res)
                    return res;
                console.error('CognitoService : getUserData -> getUserData', err);
            }));
    }
    /**
     * @return {?}
     */
    deleteUser() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        cognitoUser.deleteUser((
            /**
             * @param {?} err
             * @param {?} res
             * @return {?}
             */
            (err, res) => {
                if (res)
                    return res;
                console.error('CognitoService : deleteUser -> deleteUser', err);
            }));
    }
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
    signUp(username, password, userAttributes = [], validationData = []) {
        /** @type {?} */
        let userPool = new CognitoUserPool(this.poolData);
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                userPool.signUp(username, password, userAttributes, validationData, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            this.setUsername(username);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : signUp -> signUp', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
    /**
     * Confirm the signUp action
     *
     * @param {?} verificationCode
     * @param {?=} forceAliasCreation - Optional parameter
     * @return {?}
     */
    confirmRegistration(verificationCode, forceAliasCreation = false) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.confirmRegistration(verificationCode, forceAliasCreation, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : confirmRegistration -> confirmRegistration', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
    /**
     * Resend the signUp confirmation code
     * @return {?}
     */
    resendConfirmationCode() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.resendConfirmationCode((
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : resendConfirmationCode -> resendConfirmationCode', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
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
    sendMFACode(mfaCode, mfaType = null) {
        // TODO: dynamic code
        // SOFTWARE_TOKEN_MFA
        // SMS_MFA
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.sendMFACode(mfaCode, {
                    onSuccess: (
                        /**
                         * @param {?} session
                         * @return {?}
                         */
                        (session) => {
                            this.setUsername(cognitoUser.getUsername());
                            this.updateTokens(session);
                            this.setProvider(AuthType.COGNITO);
                            this.updateCredentials();
                            this.onSignIn.emit();
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                            return resolve(response);
                        }),
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : sendMFACode -> sendMFACode', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        })
                }, mfaType);
            }));
    }
    /**
     * Return the user's MFA status
     * @return {?}
     */
    getMFAOptions() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.getMFAOptions((
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : getMFAOptions -> getMFAOptions', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
    /**
     * Return the user's MFA status (must have a phone_number set)
     *
     * @param {?} enableMfa
     * @return {?}
     */
    setMfa(enableMfa) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                if (enableMfa) {
                    cognitoUser.enableMFA((
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        (err, res) => {
                            if (res) {
                                /** @type {?} */
                                let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response);
                            }
                            console.error('CognitoService : setMfa -> enableMFA', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                } else {
                    cognitoUser.disableMFA((
                        /**
                         * @param {?} err
                         * @param {?} res
                         * @return {?}
                         */
                        (err, res) => {
                            if (res) {
                                /** @type {?} */
                                let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                                return resolve(response);
                            }
                            console.error('CognitoService : setMfa -> disableMFA', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
                }
            }));
    }
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
    newPasswordRequired(newPassword, requiredAttributeData = {}) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.completeNewPasswordChallenge(newPassword, requiredAttributeData, {
                    onSuccess: (
                        /**
                         * @param {?} session
                         * @return {?}
                         */
                        (session) => {
                            this.updateTokens(session);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                            return resolve(response);
                        }),
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : newPasswordRequired -> completeNewPasswordChallenge', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }),
                    mfaRequired: (
                        /**
                         * @param {?} challengeName
                         * @param {?} challengeParameters
                         * @return {?}
                         */
                        (challengeName, challengeParameters) => {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.MFA_REQUIRED, {
                                challengeName: challengeName,
                                challengeParameters: challengeParameters
                            });
                            return resolve(response);
                        })
                });
            }));
    }
    /**
     * Initiate forgot password flow
     *
     * @param {?} username
     * @return {?}
     */
    forgotPassword(username) {
        /** @type {?} */
        let cognitoUser = this.setCognitoUser(username);
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.forgotPassword({
                    onSuccess: (
                        /**
                         * @param {?} data
                         * @return {?}
                         */
                        (data) => {
                            // NOTE: onSuccess is called if there is no inputVerificationCode callback
                            // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/324
                            // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/323
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, data);
                            return resolve(response);
                        }),
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : forgotPassword -> forgotPassword', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }),
                    inputVerificationCode: (
                        /**
                         * @param {?} data
                         * @return {?}
                         */
                        (data) => {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.INPUT_VERIFICATION_CODE, data);
                            return resolve(response);
                        })
                });
            }));
    }
    /**
     * Resend the forgotPassword verification code
     * @return {?}
     */
    getAttributeVerificationCode() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                /** @type {?} */
                let name = null;
                cognitoUser.getAttributeVerificationCode(name, {
                    onSuccess: (
                        /**
                         * @return {?}
                         */
                        () => {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                            return resolve(response);
                        }),
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : getAttributeVerificationCode -> getAttributeVerificationCode', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }),
                    inputVerificationCode: (
                        /**
                         * @param {?} data
                         * @return {?}
                         */
                        (data) => {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.INPUT_VERIFICATION_CODE, data);
                            return resolve(response);
                        })
                });
            }));
    }
    /**
     * Finish forgot password flow
     *
     * @param {?} newPassword
     * @param {?} verificationCode
     * @return {?}
     */
    confirmPassword(newPassword, verificationCode) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.confirmPassword(verificationCode, newPassword, {
                    /**
                     * @return {?}
                     */
                    onSuccess() {
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                        return resolve(response);
                    },
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : confirmPassword -> confirmPassword', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        })
                });
            }));
    }
    /**
     * Update a user's password
     *
     * @param {?} oldPassword
     * @param {?} newPassword
     * @return {?}
     */
    changePassword(oldPassword, newPassword) {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.changePassword(oldPassword, newPassword, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : changePassword -> changePassword', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Admin ----------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @param {?} username
     * @param {?} password
     * @return {?}
     */
    adminCreateUser(username, password, email, offerId, clientId, firstName, lastName, onlineUser, resubmission) {
        this.setAdmin();
        /** @type {?} */
        // let params = {
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
        let cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoIdentityServiceProvider.adminCreateUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminCreateUser -> adminCreateUser', err);
                        return reject(err);
                    }));
            }));
    }

    adminAddUserToGroup(username, groupname) {
        this.setAdmin();
        /** @type {?} */
        var params = {
            UserPoolId: this.poolData.UserPoolId,
            Username: username,
            GroupName: groupname
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
                cognitoIdentityServiceProvider.adminAddUserToGroup(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    function(err, res) {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminAddUserToGroup  -> adminAddUserToGroup ', err);
                        return reject(err);
                    }));
            }));
    };


    adminEnableUser(username) {
        this.setAdmin();
        /** @type {?} */
        var params = {
            Username: username,
            UserPoolId: this.poolData.UserPoolId
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
                cognitoIdentityServiceProvider.adminEnableUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    function(err, res) {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminEnableUser  -> adminEnableUser ', err);
                        return reject(err);
                    }));
            }));
    };



    adminDisableUser(username) {
        this.setAdmin();
        /** @type {?} */
        var params = {
            Username: username,
            UserPoolId: this.poolData.UserPoolId
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
                cognitoIdentityServiceProvider.adminDisableUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    function(err, res) {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminDisableUser  -> adminDisableUser ', err);
                        return reject(err);
                    }));
            }));
    };

    listGroups() {
        this.setAdmin();
        /** @type {?} */
        var params = {
            UserPoolId: this.poolData.UserPoolId
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
                cognitoIdentityServiceProvider.listGroups(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    function(err, res) {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : listGroups  -> listGroups ', err);
                        return reject(err);
                    }));
            }));
    };

    listUsers() {
        this.setAdmin();
        /** @type {?} */
        var params = {
            UserPoolId: this.poolData.UserPoolId,
            Limit: '50',
            UserPoolId: this.poolData.UserPoolId
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
                cognitoIdentityServiceProvider.listUsers(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    function(err, res) {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : listUsers  -> listUsers ', err);
                        return reject(err);
                    }));
            }));
    };

    /**
     * @param {?} username
     * @return {?}
     */
    adminDeleteUser(username) {
        this.setAdmin();
        /** @type {?} */
        let params = {
            UserPoolId: this.poolData.UserPoolId,
            Username: username
        };
        /** @type {?} */
        let cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoIdentityServiceProvider.adminDeleteUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminDeleteUser -> adminDeleteUser', err);
                        return reject(err);
                    }));
            }));
    }
    /**
     * @param {?} username
     * @return {?}
     */
    adminResetUserPassword(username) {
        this.setAdmin();
        /** @type {?} */
        let params = {
            UserPoolId: this.poolData.UserPoolId,
            Username: username
        };
        /** @type {?} */
        let cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoIdentityServiceProvider.adminResetUserPassword(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminResetUserPassword -> adminResetUserPassword', err);
                        return reject(err);
                    }));
            }));
    }
    /**
     * @param {?} username
     * @param {?} userAttributes
     * @return {?}
     */
    adminUpdateUserAttributes(username, userAttributes) {
        this.setAdmin();
        /** @type {?} */
        let params = {
            UserPoolId: this.poolData.UserPoolId,
            Username: username,
            UserAttributes: userAttributes
        };
        /** @type {?} */
        let cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoIdentityServiceProvider.adminUpdateUserAttributes(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminUpdateUserAttributes -> adminUpdateUserAttributes', err);
                        return reject(err);
                    }));
            }));
    }
    /**
     * @param {?} usernameKey
     * @param {?} username
     * @return {?}
     */
    resetExpiredAccount(usernameKey, username) {
        /** @type {?} */
        let attributes = [];
        attributes.push({
            Name: usernameKey,
            Value: username
        });
        return this.adminUpdateUserAttributes(username, attributes);
    }
    /**
     * @return {?}
     */
    setAdmin() {
        /** @type {?} */
        let creds = new Credentials(this.adminAccessKeyId, this.adminSecretKeyId);
        config.region = this.region;
        config.credentials = creds;
    }
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
    signIn(provider, username, password) {
        switch (provider) {
            case AuthType.COGNITO:
                return this.authenticateCognitoUser(username, password);
            case AuthType.GOOGLE:
                return this.callGoogle(GoogleAction.AUTHENTICATE);
            default:
                /** @type {?} */
                let error = 'Provider not recognized : use the AuthType enum to send an authorized authentication provider';
                console.error(error);
                /** @type {?} */
                let response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                return Promise.reject(response);
        }
    }
    /**
     * Refresh a user's session (retrieve refreshed tokens)
     * @return {?}
     */
    refreshSession() {
        /** @type {?} */
        let provider = null;
        provider = this.getProvider();
        switch (provider) {
            case AuthType.COGNITO:
                return this.refreshCognitoSession();
            case AuthType.GOOGLE:
                return this.callGoogle(GoogleAction.REFRESH);
            default:
                /** @type {?} */
                let error = 'Provider not recognized : the user must be logged in before updating the session';
                console.error(error);
                /** @type {?} */
                let response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                return Promise.reject(response);
        }
    }
    /**
     * @return {?}
     */
    signOut() {
        /** @type {?} */
        let provider = null;
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
    }
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
    authenticateCognitoUser(username, password) {
        /** @type {?} */
        let authenticationData = {
            Username: username,
            Password: password
        };
        /** @type {?} */
        let authenticationDetails = new AuthenticationDetails(authenticationData);
        /** @type {?} */
        let cognitoUser = this.getCognitoUser(username);
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.authenticateUser(authenticationDetails, {
                    newPasswordRequired: (
                        /**
                         * @param {?} userAttributes
                         * @param {?} requiredAttributes
                         * @return {?}
                         */
                        (userAttributes, requiredAttributes) => {
                            this.cognitoUser = cognitoUser; // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/365
                            // NOTE: https://github.com/amazon-archives/amazon-cognito-identity-js/issues/365
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.NEW_PASSWORD_REQUIRED, {
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
                        (session) => {
                            this.setUsername(username);
                            this.updateTokens(session);
                            this.setProvider(AuthType.COGNITO);
                            this.updateCredentials();
                            this.onSignIn.emit();
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, session);
                            return resolve(response);
                        }),
                    onFailure: (
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : authenticateCognitoUser -> authenticateUser', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }),
                    mfaSetup: (
                        /**
                         * @param {?} challengeName
                         * @param {?} challengeParameters
                         * @return {?}
                         */
                        (challengeName, challengeParameters) => {
                            cognitoUser.associateSoftwareToken({
                                associateSecretCode: (
                                    /**
                                     * @param {?} secretCode
                                     * @return {?}
                                     */
                                    (secretCode) => {
                                        /** @type {?} */
                                        let response = new CognitoServiceResponse(RespType.MFA_SETUP_ASSOCIATE_SECRETE_CODE, secretCode);
                                        return resolve(response);
                                    }),
                                onFailure: (
                                    /**
                                     * @param {?} err
                                     * @return {?}
                                     */
                                    (err) => {
                                        /** @type {?} */
                                        let response = new CognitoServiceResponse(RespType.MFA_SETUP_ON_FAILURE, err);
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
                        (challengeName, challengeParameters) => {
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.MFA_REQUIRED, {
                                challengeName: challengeName,
                                challengeParameters: challengeParameters
                            });
                            return resolve(response);
                        })
                });
            }));
    }
    /**
     * @private
     * @return {?}
     */
    refreshCognitoSession() {
        /** @type {?} */
        let tokens = this.getTokens();
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        /** @type {?} */
        let refreshToken = new CognitoRefreshToken({
            RefreshToken: tokens.refreshToken
        });
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoUser.refreshSession(refreshToken, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res) {
                            this.updateTokens(res);
                            this.updateCredentials();
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }
                        console.error('CognitoService : refreshSession -> refreshSession', err);
                        /** @type {?} */
                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                        return reject(response);
                    }));
            }));
    }
    /**
     * @private
     * @return {?}
     */
    signOutCognito() {
        /** @type {?} */
        let cognitoUser = this.getCognitoUser();
        if (cognitoUser)
            cognitoUser.signOut();
    }
    // !SECTION
    // -------------------------------------------------------------------------------------------
    // SECTION: Google ---------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------
    /**
     * @private
     * @return {?}
     */
    initGoogle() {
        /** @type {?} */
        let params = {
            client_id: this.googleId,
            scope: this.googleScope
        };
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                gapi.load('auth2', {
                    callback: (
                        /**
                         * @param {?} _
                         * @return {?}
                         */
                        _ => {
                            gapi.auth2.init(params)
                                .then((
                                    /**
                                     * @param {?} googleAuth
                                     * @return {?}
                                     */
                                    (googleAuth) => {
                                        this.googleAuth = googleAuth;
                                        /** @type {?} */
                                        let response = new CognitoServiceResponse(RespType.ON_SUCCESS, googleAuth);
                                        return resolve(response);
                                    }), (
                                    /**
                                     * @param {?} reason
                                     * @return {?}
                                     */
                                    (reason) => {
                                        console.error('CognitoService : initGoogle -> GoogleAuth', reason);
                                        /** @type {?} */
                                        let response = new CognitoServiceResponse(RespType.ON_FAILURE, reason);
                                        return reject(response);
                                    }));
                        }),
                    onerror: (
                        /**
                         * @param {?} _
                         * @return {?}
                         */
                        _ => {
                            // Handle loading error
                            /** @type {?} */
                            let error = 'gapi.client failed to load';
                            console.error('CognitoService : initGoogle -> load', error);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_ERROR, error);
                            return reject(response);
                        }),
                    timeout: 5000,
                    // 5 seconds
                    ontimeout: (
                        /**
                         * @param {?} _
                         * @return {?}
                         */
                        _ => {
                            // Handle timeout
                            /** @type {?} */
                            let error = 'gapi.client could not load in a timely manner';
                            console.error('CognitoService : initGoogle -> load', error);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_TIMEOUT, error);
                            return reject(response);
                        })
                });
            }));
    }
    /**
     * @private
     * @param {?} action
     * @return {?}
     */
    callGoogle(action) {
        if (this.googleAuth) {
            return this.makeGoogle(action);
        } else {
            return new Promise((
                /**
                 * @param {?} resolve
                 * @param {?} reject
                 * @return {?}
                 */
                (resolve, reject) => {
                    this.initGoogle()
                        .then((
                            /**
                             * @param {?} _
                             * @return {?}
                             */
                            _ => {
                                this.makeGoogle(action)
                                    .then((
                                        /**
                                         * @param {?} res
                                         * @return {?}
                                         */
                                        res => resolve(res)))
                                    .catch((
                                        /**
                                         * @param {?} err
                                         * @return {?}
                                         */
                                        err => reject(err)));
                            }))
                        .catch((
                            /**
                             * @param {?} error
                             * @return {?}
                             */
                            error => {
                                /** @type {?} */
                                let response = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                                return Promise.reject(response);
                            }));
                }));
        }
    }
    /**
     * @private
     * @param {?} action
     * @return {?}
     */
    makeGoogle(action) {
        switch (action) {
            case GoogleAction.AUTHENTICATE:
                return this.authenticateGoogleUser();
            case GoogleAction.REFRESH:
                return this.refreshGoogleSession();
            case GoogleAction.LOGOUT:
                this.signOutGoogle();
                /** @type {?} */
                let logoutResponse = new CognitoServiceResponse(RespType.ON_SUCCESS, null);
                return Promise.resolve(logoutResponse);
            default:
                /** @type {?} */
                let error = 'Google action not recognized : authenticate / refresh / logout';
                console.error(error);
                /** @type {?} */
                let defaultResponse = new CognitoServiceResponse(RespType.ON_FAILURE, error);
                return Promise.reject(defaultResponse);
        }
    }
    /**
     * @private
     * @return {?}
     */
    authenticateGoogleUser() {
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                /** @type {?} */
                let options = {
                    scope: this.googleScope
                };
                this.googleAuth.signIn(options)
                    .then((
                        /**
                         * @param {?} googleUser
                         * @return {?}
                         */
                        (googleUser) => {
                            /** @type {?} */
                            let googleResponse = googleUser.getAuthResponse();
                            /** @type {?} */
                            let googleProfile = googleUser.getBasicProfile();
                            this.setUsername(googleProfile.getName());
                            this.setIdToken(googleResponse.id_token);
                            this.setExpiresAt(googleResponse.expires_at);
                            this.setProvider(AuthType.GOOGLE);
                            this.updateCredentials();
                            this.onSignIn.emit();
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, googleProfile);
                            return resolve(response);
                        }), (
                        /**
                         * @param {?} onRejected
                         * @return {?}
                         */
                        (onRejected) => {
                            // Can be : popup_blocked_by_browser
                            console.error('CognitoService : authenticateGoogleUser -> signIn', onRejected);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_REJECTED, onRejected);
                            return reject(response);
                        }))
                    .catch((
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        (err) => {
                            console.error('CognitoService : authenticateGoogleUser -> signIn', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
            }));
    }
    /**
     * @private
     * @return {?}
     */
    refreshGoogleSession() {
        /** @type {?} */
        let googleUser = null;
        googleUser = this.googleAuth.currentUser.get();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                googleUser.reloadAuthResponse()
                    .then((
                        /**
                         * @param {?} res
                         * @return {?}
                         */
                        (res) => {
                            this.setIdToken(res.id_token);
                            this.setExpiresAt(res.expires_at);
                            this.updateCredentials();
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_SUCCESS, res);
                            return resolve(response);
                        }))
                    .catch((
                        /**
                         * @param {?} err
                         * @return {?}
                         */
                        err => {
                            console.error('CognitoService : refreshGoogleSession -> reloadAuthResponse', err);
                            /** @type {?} */
                            let response = new CognitoServiceResponse(RespType.ON_FAILURE, err);
                            return reject(response);
                        }));
            }));
    }
    /**
     * @private
     * @return {?}
     */
    signOutGoogle() {
        this.googleAuth.signOut()
            .then((
                /**
                 * @param {?} _
                 * @return {?}
                 */
                _ => {
                    this.googleAuth.disconnect();
                }));
    }
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
    setCognitoUser(username) {
        /** @type {?} */
        let cognitoUser = null;
        /** @type {?} */
        let cognitoUserPool = new CognitoUserPool(this.poolData);
        /** @type {?} */
        let userData = {
            Username: username,
            Pool: cognitoUserPool
        };
        cognitoUser = new CognitoUser(userData);
        this.cognitoUser = cognitoUser; // Store the user in the service
        this.setUsername(username); // Store the username in the local storage
        return cognitoUser;
    }
    // NOTE: Session -----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} expiresAt
     * @return {?}
     */
    setExpiresAt(expiresAt) {
        /** @type {?} */
        let storageKey = null;
        storageKey = this.storagePrefix + 'ExpiresAt';
        localStorage.setItem(storageKey, expiresAt.toString());
    }
    // NOTE: Username ----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} username
     * @return {?}
     */
    setUsername(username) {
        /** @type {?} */
        let storageKey = null;
        storageKey = this.storagePrefix + 'Username';
        localStorage.setItem(storageKey, username);
    }
    // NOTE: Provider ----------------------------------------------------------------------------
    /**
     * @private
     * @param {?} provider
     * @return {?}
     */
    setProvider(provider) {
        /** @type {?} */
        let storageKey = null;
        storageKey = this.storagePrefix + 'Provider';
        localStorage.setItem(storageKey, provider);
    }
    // NOTE: Token -------------------------------------------------------------------------------
    /**
     * @private
     * @param {?} token
     * @return {?}
     */
    setIdToken(token) {
        /** @type {?} */
        let storageKey = null;
        storageKey = this.storagePrefix + 'IdToken';
        localStorage.setItem(storageKey, token);
    }
    /**
     * @private
     * @param {?} session
     * @return {?}
     */
    setTokens(session) {
        /** @type {?} */
        let storageKey = null;
        /** @type {?} */
        let tokensStr = null;
        /** @type {?} */
        let tokensObj = null;
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
    }
    /**
     * @private
     * @param {?} session
     * @return {?}
     */
    updateTokens(session) {
        /** @type {?} */
        let tokens = null;
        this.setTokens(session);
        tokens = this.getTokens();
        this.setIdToken(tokens.idToken);
        this.setExpiresAt(tokens.idTokenExpiresAt);
    }
    // NOTE: Storage -----------------------------------------------------------------------------
    /**
     * @private
     * @return {?}
     */
    clearStorage() {
        localStorage.removeItem(this.storagePrefix + 'Username');
        localStorage.removeItem(this.storagePrefix + 'Provider');
        localStorage.removeItem(this.storagePrefix + 'IdToken');
        localStorage.removeItem(this.storagePrefix + 'ExpiresAt');
        localStorage.removeItem(this.storagePrefix + 'SessionTokens');
    }
}
CognitoService.decorators = [{
    type: Injectable,
    args: [{
        providedIn: 'root'
    }, ]
}];
/** @nocollapse */
CognitoService.ctorParameters = () => [{
    type: undefined,
    decorators: [{
        type: Inject,
        args: ['cognitoConst', ]
    }, {
        type: Optional
    }]
}];
/** @nocollapse */
CognitoService.ngInjectableDef = defineInjectable({
    factory: function CognitoService_Factory() {
        return new CognitoService(inject("cognitoConst", 8));
    },
    token: CognitoService,
    providedIn: "root"
});

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export {
    CognitoServiceResponse,
    AuthType,
    RespType,
    GoogleAction,
    CognitoService
};

//# sourceMappingURL=caliatys-cognito-service.js.map