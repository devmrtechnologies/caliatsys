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
const GoogleAction = {
    AUTHENTICATE: 'authenticate',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
};
export {
    GoogleAction
};
export class CognitoService {
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
                let sts = new AWS.STS();
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
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: this.identityPool,
        });
        AWS.config.region = this.region;
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
                let credentials = ( /** @type {?} */ (AWS.config.credentials));
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
                        return resolve(AWS.config.credentials);
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
        AWS.config.region = this.region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(options, clientConfig);
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
        let cognitoUserPool = new AWSCognito.CognitoUserPool(this.poolData);
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
        let userPool = new AWSCognito.CognitoUserPool(this.poolData);
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
    adminCreateUser(username, password, email, promotionId, clientList, firstName, lastName, onlineSubmission, resubmission) {
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
        let cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
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
        let cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
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
    adminGetUser(username) {
        this.setAdmin();
        /** @type {?} */
        let params = {
            UserPoolId: this.poolData.UserPoolId,
            Username: username
        };
        /** @type {?} */
        let cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        return new Promise((
            /**
             * @param {?} resolve
             * @param {?} reject
             * @return {?}
             */
            (resolve, reject) => {
                cognitoIdentityServiceProvider.adminGetUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminGetUser -> adminGetUser', err);
                        return reject(err);
                    }));
            }));
    }

    adminListGroupsForUser(username,limit,nextToken) {
        this.setAdmin();
        /** @type {?} */
        let params = {
            Limit: limit,
            NextToken: nextToken,
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
                cognitoIdentityServiceProvider.adminListGroupsForUser(params, (
                    /**
                     * @param {?} err
                     * @param {?} res
                     * @return {?}
                     */
                    (err, res) => {
                        if (res)
                            return resolve(res);
                        console.error('CognitoService : adminListGroupsForUser -> adminListGroupsForUser', err);
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
        let cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
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
        let cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
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
        let creds = new AWS.Credentials(this.adminAccessKeyId, this.adminSecretKeyId);
        AWS.config.region = this.region;
        AWS.config.credentials = creds;
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
        let authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
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
        let refreshToken = new AWSCognito.CognitoRefreshToken({
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
        let cognitoUserPool = new AWSCognito.CognitoUserPool(this.poolData);
        /** @type {?} */
        let userData = {
            Username: username,
            Pool: cognitoUserPool
        };
        cognitoUser = new AWSCognito.CognitoUser(userData);
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
CognitoService.ngInjectableDef = i0.defineInjectable({
    factory: function CognitoService_Factory() {
        return new CognitoService(i0.inject("cognitoConst", 8));
    },
    token: CognitoService,
    providedIn: "root"
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQGNhbGlhdHlzL2NvZ25pdG8tc2VydmljZS8iLCJzb3VyY2VzIjpbImxpYi9jb2duaXRvLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQWtCLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQXNCLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQW9CLGVBQWUsQ0FBQztBQUN2RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQWdCLGVBQWUsQ0FBQzs7QUFHdkQsT0FBTyxLQUFLLFVBQVUsTUFBaUIsNEJBQTRCLENBQUM7QUFDcEUsT0FBTyxLQUFLLEdBQUcsTUFBd0IsU0FBUyxDQUFDOztBQUlqRCxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQzs7QUFHakYsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFvQix3QkFBd0IsQ0FBQztBQUNoRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQW9CLHdCQUF3QixDQUFDOzs7O0lBSTlELGNBQWUsY0FBYztJQUM3QixTQUFlLFNBQVM7SUFDeEIsUUFBZSxRQUFROzs7QUFNekIsTUFBTSxPQUFPLGNBQWM7Ozs7SUEwQnpCLFlBRTZDLFlBQWtCO1FBQWxCLGlCQUFZLEdBQVosWUFBWSxDQUFNO1FBaEJ2RCxhQUFRLEdBQXFDO1lBQ25ELFVBQVUsRUFBRyxJQUFJOztZQUNqQixRQUFRLEVBQUssSUFBSSxDQUFFLHdCQUF3QjtTQUM1QyxDQUFDO1FBZ0JBLElBQUksQ0FBQyxRQUFRLEdBQWUsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFjLElBQUksWUFBWSxFQUFFLENBQUM7UUFFL0MsSUFBSSxDQUFDLGFBQWEsR0FBUyxZQUFZLENBQUMsYUFBYSxHQUFHLGtCQUFrQixDQUFDO1FBRTNFLElBQUks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QUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM3QyxDQUFDOzs7Ozs7SUFJTyxZQUFZO1FBRWxCLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsQ0FBQztRQUN6RCxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLENBQUM7UUFDekQsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUMsQ0FBQztRQUMxRCxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUM7SUFDaEUsQ0FBQzs7O1lBcnRDRixVQUFVLFNBQUM7Z0JBQ1YsVUFBVSxFQUFHLE1BQU07YUFDcEI7Ozs7NENBNkJJLE1BQU0sU0FBQyxjQUFjLGNBQUcsUUFBUTs7Ozs7SUExQm5DLGtDQUErQzs7SUFDL0MsbUNBQStDOzs7OztJQUkvQyx1Q0FBa0M7Ozs7O0lBRWxDLGtDQUFrQzs7Ozs7SUFDbEMscUNBQWtDOzs7OztJQUVsQyxrQ0FHRTs7Ozs7SUFFRixzQ0FBa0M7Ozs7O0lBQ2xDLGdDQUFrQzs7Ozs7SUFFbEMsMENBQWtDOzs7OztJQUNsQywwQ0FBa0M7Ozs7O0lBRWxDLG9DQUFpRDs7Ozs7SUFDakQscUNBQWtEOztJQUloRCxzQ0FBNkQiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBbmd1bGFyIG1vZHVsZXNcbmltcG9ydCB7IEluamVjdGFibGUgfSAgICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEluamVjdCB9ICAgICAgICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9wdGlvbmFsIH0gICAgICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9ICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLy8gRXh0ZXJuYWwgbW9kdWxlc1xuaW1wb3J0ICogYXMgQVdTQ29nbml0byAgICAgICAgICAgIGZyb20gJ2FtYXpvbi1jb2duaXRvLWlkZW50aXR5LWpzJztcbmltcG9ydCAqIGFzIEFXUyAgICAgICAgICAgICAgICAgICBmcm9tICdhd3Mtc2RrJztcbmltcG9ydCAqIGFzIGF3c3NlcnZpY2UgICAgICAgICAgICBmcm9tICdhd3Mtc2RrL2xpYi9zZXJ2aWNlJztcblxuLy8gTW9kZWxzXG5pbXBvcnQgeyBDb2duaXRvU2VydmljZVJlc3BvbnNlIH0gZnJvbSAnLi9tb2RlbHMvY29nbml0by1zZXJ2aWNlLXJlc3BvbnNlLm1vZGVsJztcblxuLy8gRW51bXNcbmltcG9ydCB7IEF1dGhUeXBlIH0gICAgICAgICAgICAgICBmcm9tICcuL2VudW1zL2F1dGgtdHlwZS5lbnVtJztcbmltcG9ydCB7IFJlc3BUeXBlIH0gICAgICAgICAgICAgICBmcm9tICcuL2VudW1zL3Jlc3AtdHlwZS5lbnVtJztcblxuZXhwb3J0IGVudW0gR29vZ2xlQWN0aW9uXG57XG4gIEFVVEhFTlRJQ0FURSA9ICdhdXRoZW50aWNhdGUnLFxuICBSRUZSRVNIICAgICAgPSAncmVmcmVzaCcsXG4gIExPR09VVCAgICAgICA9ICdsb2dvdXQnXG59XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbiA6ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBDb2duaXRvU2VydmljZVxue1xuICBwdWJsaWMgIG9uU2lnbkluICAgICAgICAgIDogRXZlbnRFbWl0dGVyPG51bGw+O1xuICBwdWJsaWMgIG9uU2lnbk91dCAgICAgICAgIDogRXZlbnRFbWl0dGVyPG51bGw+O1xuXG4gIC8vIHByaXZhdGUgTUZBICAgICAgICAgICAgICA6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIHN0b3JhZ2VQcmVmaXggICAgOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBnb29nbGVJZCAgICAgICAgIDogc3RyaW5nO1xuICBwcml2YXRlIGdvb2dsZVNjb3BlICAgICAgOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBwb29sRGF0YSA6IEFXU0NvZ25pdG8uSUNvZ25pdG9Vc2VyUG9vbERhdGEgPSB7XG4gICAgVXNlclBvb2xJZCA6IG51bGwsIC8vIENvZ25pdG9Vc2VyUG9vbFxuICAgIENsaWVudElkICAgOiBudWxsICAvLyBDb2duaXRvVXNlclBvb2xDbGllbnRcbiAgfTtcblxuICBwcml2YXRlIGlkZW50aXR5UG9vbCAgICAgOiBzdHJpbmc7IC8vIENvZ25pdG9JZGVudGl0eVBvb2xcbiAgcHJpdmF0ZSByZWdpb24gICAgICAgICAgIDogc3RyaW5nOyAvLyBSZWdpb24gTWF0Y2hpbmcgQ29nbml0b1VzZXJQb29sIHJlZ2lvblxuXG4gIHByaXZhdGUgYWRtaW5BY2Nlc3NLZXlJZCA6IHN0cmluZztcbiAgcHJpdmF0ZSBhZG1pblNlY3JldEtleUlkIDogc3RyaW5nO1xuXG4gIHByaXZhdGUgZ29vZ2xlQXV0aCAgICAgICA6IGdhcGkuYXV0aDIuR29vZ2xlQXV0aDtcbiAgcHJpdmF0ZSBjb2duaXRvVXNlciAgICAgIDogQVdTQ29nbml0by5Db2duaXRvVXNlcjtcblxuICBjb25zdHJ1Y3RvclxuICAoXG4gICAgQEluamVjdCgnY29nbml0b0NvbnN0JykgQE9wdGlvbmFsKCkgcHVibGljIGNvZ25pdG9Db25zdCA6IGFueVxuICApXG4gIHtcbiAgICB0aGlzLm9uU2lnbkluICAgICAgICAgICAgID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMub25TaWduT3V0ICAgICAgICAgICAgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICB0aGlzLnN0b3JhZ2VQcmVmaXggICAgICAgPSBjb2duaXRvQ29uc3Quc3RvcmFnZVByZWZpeCArICdfQ29nbml0b1NlcnZpY2VfJztcblxuICAgIHRoaXMuZ29vZ2xlSWQgICAgICAgICAgICA9IGNvZ25pdG9Db25zdC5nb29nbGVJZDtcbiAgICB0aGlzLmdvb2dsZVNjb3BlICAgICAgICAgPSBjb2duaXRvQ29uc3QuZ29vZ2xlU2NvcGU7XG5cbiAgICB0aGlzLnBvb2xEYXRhLlVzZXJQb29sSWQgPSBjb2duaXRvQ29uc3QucG9vbERhdGEuVXNlclBvb2xJZDtcbiAgICB0aGlzLnBvb2xEYXRhLkNsaWVudElkICAgPSBjb2duaXRvQ29uc3QucG9vbERhdGEuQ2xpZW50SWQ7XG5cbiAgICB0aGlzLmlkZW50aXR5UG9vbCAgICAgICAgPSBjb2duaXRvQ29uc3QuaWRlbnRpdHlQb29sO1xuXG4gICAgdGhpcy5yZWdpb24gICAgICAgICAgICAgID0gY29nbml0b0NvbnN0LnJlZ2lvbjtcbiAgICB0aGlzLmFkbWluQWNjZXNzS2V5SWQgICAgPSBjb2duaXRvQ29uc3QuYWRtaW5BY2Nlc3NLZXlJZDtcbiAgICB0aGlzLmFkbWluU2VjcmV0S2V5SWQgICAgPSBjb2duaXRvQ29uc3QuYWRtaW5TZWNyZXRLZXlJZDtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogSGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gTk9URTogTWlzYyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBpc0F1dGhlbnRpY2F0ZWQoKSA6IGJvb2xlYW5cbiAge1xuICAgIGlmICh0aGlzLmdldFJlbWFpbmluZygpKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHVibGljIHN0cygpIDogUHJvbWlzZTxBV1MuU1RTLkdldENhbGxlcklkZW50aXR5UmVzcG9uc2UgfCBBV1MuQVdTRXJyb3I+XG4gIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBsZXQgc3RzID0gbmV3IEFXUy5TVFMoKTtcbiAgICAgIGxldCBwYXJhbXMgOiBBV1MuU1RTLkdldENhbGxlcklkZW50aXR5UmVxdWVzdCA9IG51bGw7XG4gICAgICBzdHMuZ2V0Q2FsbGVySWRlbnRpdHkocGFyYW1zLCAoZXJyIDogQVdTLkFXU0Vycm9yLCBkYXRhIDogQVdTLlNUUy5HZXRDYWxsZXJJZGVudGl0eVJlc3BvbnNlKSA9PlxuICAgICAge1xuICAgICAgICBpZiAoZGF0YSlcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBzdHMgLT4gZ2V0Q2FsbGVySWRlbnRpdHknLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE5PVEU6IFNlc3Npb24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgYXV0b1JlZnJlc2hTZXNzaW9uKCkgOiB2b2lkXG4gIHtcbiAgICBsZXQgZXhwaXJlc0F0ID0gdGhpcy5nZXRFeHBpcmVzQXQoKTtcbiAgICBpZiAoIWV4cGlyZXNBdClcbiAgICAgIHJldHVybjtcblxuICAgIGxldCB0aW1lRGlmZiA9IGV4cGlyZXNBdC5nZXRUaW1lKCkgLSBEYXRlLm5vdygpIC0gNjAwMDA7IC8vIDEgbWluXG5cbiAgICBpZiAodGltZURpZmYgPCAwKVxuICAgIHtcbiAgICAgIHRoaXMuc2lnbk91dCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQoKCkgPT5cbiAgICB7XG4gICAgICAvLyBSZWZyZXNoIHRva2VuXG4gICAgICB0aGlzLnJlZnJlc2hTZXNzaW9uKCkudGhlbihfID0+XG4gICAgICB7XG4gICAgICAgIHRoaXMuYXV0b1JlZnJlc2hTZXNzaW9uKCk7XG4gICAgICB9KS5jYXRjaChfID0+XG4gICAgICB7XG4gICAgICAgIHRoaXMuc2lnbk91dCgpO1xuICAgICAgfSk7XG4gICAgfSwgdGltZURpZmYpO1xuICB9XG5cbiAgcHVibGljIGdldFJlbWFpbmluZygpIDogbnVtYmVyXG4gIHtcbiAgICBsZXQgcmVtYWluaW5nIDogbnVtYmVyID0gMDtcbiAgICBsZXQgbm93ICAgICAgIDogbnVtYmVyID0gMDtcbiAgICBsZXQgbWF4ICAgICAgIDogRGF0ZSAgID0gbnVsbDtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIG1heCA9IHRoaXMuZ2V0RXhwaXJlc0F0KCk7XG5cbiAgICBpZiAoIW1heClcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHJlbWFpbmluZyA9IG1heC5nZXRUaW1lKCkgLSBub3c7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwKVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHJlbWFpbmluZztcbiAgfVxuXG4gIHB1YmxpYyBnZXRFeHBpcmVzQXQoKSA6IERhdGVcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5ICAgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCBleHBpcmVzQXRTdHIgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCBleHBpcmVzQXROdW0gOiBudW1iZXIgPSBudWxsO1xuICAgIGxldCBleHBpcmVzQXREYXQgOiBEYXRlICAgPSBudWxsO1xuICAgIHN0b3JhZ2VLZXkgICA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdFeHBpcmVzQXQnO1xuICAgIGV4cGlyZXNBdFN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIGlmIChleHBpcmVzQXRTdHIpXG4gICAge1xuICAgICAgZXhwaXJlc0F0TnVtID0gTnVtYmVyKGV4cGlyZXNBdFN0cik7XG4gICAgICBpZiAoZXhwaXJlc0F0TnVtKVxuICAgICAgICBleHBpcmVzQXREYXQgPSBuZXcgRGF0ZShleHBpcmVzQXROdW0pO1xuICAgIH1cbiAgICByZXR1cm4gZXhwaXJlc0F0RGF0O1xuICB9XG5cbiAgLy8gTk9URTogVXNlcm5hbWUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHB1YmxpYyBnZXRVc2VybmFtZSgpIDogc3RyaW5nXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IHByb3ZpZGVyICAgOiBzdHJpbmcgPSBudWxsO1xuICAgIHN0b3JhZ2VLZXkgPSB0aGlzLnN0b3JhZ2VQcmVmaXggKyAnVXNlcm5hbWUnO1xuICAgIHByb3ZpZGVyICAgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcbiAgICByZXR1cm4gcHJvdmlkZXI7XG4gIH1cblxuICAvLyBOT1RFOiBQcm92aWRlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHVibGljIGdldFByb3ZpZGVyKCkgOiBzdHJpbmdcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgcHJvdmlkZXIgICA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdQcm92aWRlcic7XG4gICAgcHJvdmlkZXIgICA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIHJldHVybiBwcm92aWRlcjtcbiAgfVxuXG4gIC8vIE5PVEU6IFRva2VuIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgZ2V0SWRUb2tlbigpIDogc3RyaW5nXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IGlkVG9rZW4gICAgOiBzdHJpbmcgPSBudWxsO1xuICAgIHN0b3JhZ2VLZXkgPSB0aGlzLnN0b3JhZ2VQcmVmaXggKyAnSWRUb2tlbic7XG4gICAgaWRUb2tlbiAgICA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIHJldHVybiBpZFRva2VuO1xuICB9XG5cbiAgcHVibGljIGdldFRva2VucygpIDogYW55XG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IHRva2Vuc1N0ciAgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCB0b2tlbnNPYmogIDogYW55ICAgID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Nlc3Npb25Ub2tlbnMnO1xuICAgIHRva2Vuc1N0ciAgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcbiAgICB0b2tlbnNPYmogID0gSlNPTi5wYXJzZSh0b2tlbnNTdHIpO1xuICAgIHJldHVybiB0b2tlbnNPYmo7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogQ3JlZGVudGlhbHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHVibGljIGluaXRDcmVkZW50aWFscygpIDogdm9pZFxuICB7XG4gICAgQVdTLmNvbmZpZy5jcmVkZW50aWFscyA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5Q3JlZGVudGlhbHMoe1xuICAgICAgSWRlbnRpdHlQb29sSWQgOiB0aGlzLmlkZW50aXR5UG9vbCxcbiAgICB9KTtcbiAgICBBV1MuY29uZmlnLnJlZ2lvbiA9IHRoaXMucmVnaW9uO1xuICB9XG5cbiAgcHVibGljIGdldENyZWRlbnRpYWxzKCkgOiBQcm9taXNlPGFueT5cbiAge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGxldCBjcmVkZW50aWFscyA9IEFXUy5jb25maWcuY3JlZGVudGlhbHMgYXMgYW55O1xuICAgICAgaWYgKCFjcmVkZW50aWFscylcbiAgICAgIHtcbiAgICAgICAgbGV0IGVycm9yID0gJ1lvdSBtdXN0IGluaXRpYWxpemUgdGhlIGNyZWRlbnRpYWxzIHdpdGggaW5pdENyZWRlbnRpYWxzKCknO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGdldENyZWRlbnRpYWxzJywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGNyZWRlbnRpYWxzLmdldCgoZXJyKSA9PlxuICAgICAge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBnZXRDcmVkZW50aWFscycsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlKEFXUy5jb25maWcuY3JlZGVudGlhbHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlQ3JlZGVudGlhbHMoY2xpZW50Q29uZmlnID86IGF3c3NlcnZpY2UuU2VydmljZUNvbmZpZ3VyYXRpb25PcHRpb25zKSA6IHZvaWRcbiAge1xuICAgIGxldCB1cmwgICAgICA6IHN0cmluZyA9IG51bGw7XG4gICAgbGV0IHByb3ZpZGVyIDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgaWRUb2tlbiAgOiBzdHJpbmcgPSBudWxsO1xuXG4gICAgcHJvdmlkZXIgPSB0aGlzLmdldFByb3ZpZGVyKCk7XG4gICAgaWRUb2tlbiAgPSB0aGlzLmdldElkVG9rZW4oKTtcblxuICAgIHN3aXRjaCAocHJvdmlkZXIpXG4gICAge1xuICAgICAgY2FzZSBBdXRoVHlwZS5DT0dOSVRPIDpcbiAgICAgICAgdXJsID0gJ2NvZ25pdG8taWRwLicgKyB0aGlzLnJlZ2lvbi50b0xvd2VyQ2FzZSgpICsgJy5hbWF6b25hd3MuY29tLycgKyB0aGlzLnBvb2xEYXRhLlVzZXJQb29sSWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBdXRoVHlwZS5HT09HTEUgOlxuICAgICAgICB1cmwgPSAnYWNjb3VudHMuZ29vZ2xlLmNvbSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdCA6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogc2V0Q3JlZGVudGlhbHMgLT4gUHJvdmlkZXIgbm90IHJlY29nbml6ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBsb2dpbnMgOiBhbnkgPSB7fTtcbiAgICBsb2dpbnNbdXJsXSA9IGlkVG9rZW47XG5cbiAgICBpZiAoIXRoaXMuaWRlbnRpdHlQb29sKVxuICAgIHtcbiAgICAgIGNvbnNvbGUuaW5mbygnV2UgcmVjb21tZW5kIHRoYXQgeW91IHByb3ZpZGUgYW4gaWRlbnRpdHkgcG9vbCBJRCBmcm9tIGEgZmVkZXJhdGVkIGlkZW50aXR5Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG9wdGlvbnMgOiBBV1MuQ29nbml0b0lkZW50aXR5Q3JlZGVudGlhbHMuQ29nbml0b0lkZW50aXR5T3B0aW9ucyA9IHtcbiAgICAgIElkZW50aXR5UG9vbElkIDogdGhpcy5pZGVudGl0eVBvb2wsXG4gICAgICBMb2dpbnMgICAgICAgICA6IGxvZ2luc1xuICAgIH07XG5cbiAgICBBV1MuY29uZmlnLnJlZ2lvbiAgICAgID0gdGhpcy5yZWdpb247XG4gICAgQVdTLmNvbmZpZy5jcmVkZW50aWFscyA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5Q3JlZGVudGlhbHMob3B0aW9ucywgY2xpZW50Q29uZmlnKTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBVc2VyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgZ2V0Q29nbml0b1VzZXIodXNlcm5hbWUgOiBzdHJpbmcgPSBudWxsKSA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJcbiAge1xuICAgIGlmICh0aGlzLmNvZ25pdG9Vc2VyKVxuICAgICAgcmV0dXJuIHRoaXMuY29nbml0b1VzZXI7IC8vIFVzZXIgc3RvcmVkIGluIHRoZSBzZXJ2aWNlXG5cbiAgICBsZXQgY29nbml0b1VzZXIgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyID0gbnVsbDtcbiAgICBsZXQgY29nbml0b1VzZXJQb29sID0gbmV3IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJQb29sKHRoaXMucG9vbERhdGEpO1xuXG4gICAgY29nbml0b1VzZXIgPSBjb2duaXRvVXNlclBvb2wuZ2V0Q3VycmVudFVzZXIoKTsgLy8gQXV0aGVudGljYXRlZCB1c2VyXG5cbiAgICBpZiAoIWNvZ25pdG9Vc2VyKVxuICAgIHtcbiAgICAgIGxldCBuYW1lIDogc3RyaW5nID0gbnVsbDtcbiAgICAgIGlmICh1c2VybmFtZSlcbiAgICAgICAgbmFtZSA9IHVzZXJuYW1lOyAvLyBVc2VyIHNlbnRcbiAgICAgIGVsc2VcbiAgICAgICAgbmFtZSA9IHRoaXMuZ2V0VXNlcm5hbWUoKTsgLy8gVXNlciBzdG9yZWQgaW4gbG9jYWwgc3RvcmFnZVxuICAgICAgY29nbml0b1VzZXIgPSB0aGlzLnNldENvZ25pdG9Vc2VyKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjb2duaXRvVXNlcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRVc2VyQXR0cmlidXRlcygpIDogYW55XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG4gICAgY29nbml0b1VzZXIuZ2V0VXNlckF0dHJpYnV0ZXMoKGVyciA6IEVycm9yLCByZXMgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyQXR0cmlidXRlW10pID0+XG4gICAge1xuICAgICAgaWYgKHJlcylcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZ2V0VXNlckF0dHJpYnV0ZXMgLT4gZ2V0VXNlckF0dHJpYnV0ZXMnLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGRlbGV0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlTGlzdCA6IHN0cmluZ1tdKSA6IGFueVxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuICAgIGNvZ25pdG9Vc2VyLmRlbGV0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlTGlzdCwgKGVyciA6IEVycm9yLCByZXMgOiBzdHJpbmcpID0+XG4gICAge1xuICAgICAgaWYgKHJlcylcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZGVsZXRlQXR0cmlidXRlcyAtPiBkZWxldGVBdHRyaWJ1dGVzJywgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRVc2VyRGF0YSgpIDogYW55XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG4gICAgY29nbml0b1VzZXIuZ2V0VXNlckRhdGEoKGVyciA6IEVycm9yLCByZXMgOiBBV1NDb2duaXRvLlVzZXJEYXRhKSA9PlxuICAgIHtcbiAgICAgIGlmIChyZXMpXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGdldFVzZXJEYXRhIC0+IGdldFVzZXJEYXRhJywgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkZWxldGVVc2VyKCkgOiBhbnlcbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICBjb2duaXRvVXNlci5kZWxldGVVc2VyKChlcnIgOiBFcnJvciwgcmVzIDogc3RyaW5nKSA9PlxuICAgIHtcbiAgICAgIGlmIChyZXMpXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGRlbGV0ZVVzZXIgLT4gZGVsZXRlVXNlcicsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogUmVnaXN0cmF0aW9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IHVzZXJcbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lXG4gICAqIEBwYXJhbSBwYXNzd29yZFxuICAgKiBAcGFyYW0gdXNlckF0dHJpYnV0ZXMgLSBPcHRpb25hbCBwYXJhbWV0ZXJcbiAgICogQHBhcmFtIHZhbGlkYXRpb25EYXRhIC0gT3B0aW9uYWwgcGFyYW1ldGVyXG4gICAqL1xuICBwdWJsaWMgc2lnblVwKHVzZXJuYW1lIDogc3RyaW5nLCBwYXNzd29yZCA6IHN0cmluZywgdXNlckF0dHJpYnV0ZXMgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyQXR0cmlidXRlW10gPSBbXSwgdmFsaWRhdGlvbkRhdGEgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyQXR0cmlidXRlW10gPSBbXSkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgdXNlclBvb2wgPSBuZXcgQVdTQ29nbml0by5Db2duaXRvVXNlclBvb2wodGhpcy5wb29sRGF0YSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICB1c2VyUG9vbC5zaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkLCB1c2VyQXR0cmlidXRlcywgdmFsaWRhdGlvbkRhdGEsIChlcnIgOiBFcnJvciwgcmVzIDogQVdTQ29nbml0by5JU2lnblVwUmVzdWx0KSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5zZXRVc2VybmFtZSh1c2VybmFtZSk7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgcmVzKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBzaWduVXAgLT4gc2lnblVwJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maXJtIHRoZSBzaWduVXAgYWN0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJpZmljYXRpb25Db2RlXG4gICAqIEBwYXJhbSBmb3JjZUFsaWFzQ3JlYXRpb24gLSBPcHRpb25hbCBwYXJhbWV0ZXJcbiAgICovXG4gIHB1YmxpYyBjb25maXJtUmVnaXN0cmF0aW9uKHZlcmlmaWNhdGlvbkNvZGUgOiBzdHJpbmcsIGZvcmNlQWxpYXNDcmVhdGlvbiA6IGJvb2xlYW4gPSBmYWxzZSkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5jb25maXJtUmVnaXN0cmF0aW9uKHZlcmlmaWNhdGlvbkNvZGUsIGZvcmNlQWxpYXNDcmVhdGlvbiwgKGVyciA6IGFueSwgcmVzIDogYW55KSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgcmVzKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBjb25maXJtUmVnaXN0cmF0aW9uIC0+IGNvbmZpcm1SZWdpc3RyYXRpb24nLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2VuZCB0aGUgc2lnblVwIGNvbmZpcm1hdGlvbiBjb2RlXG4gICAqL1xuICBwdWJsaWMgcmVzZW5kQ29uZmlybWF0aW9uQ29kZSgpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b1VzZXIucmVzZW5kQ29uZmlybWF0aW9uQ29kZSgoZXJyIDogRXJyb3IsIHJlcyA6IHN0cmluZykgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogcmVzZW5kQ29uZmlybWF0aW9uQ29kZSAtPiByZXNlbmRDb25maXJtYXRpb25Db2RlJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBNRkEgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogTG9naW4gMm5kIHN0ZXAgZm9yIHVzZXJzIHdpdGggTUZBIGVuYWJsZWRcbiAgICpcbiAgICogQHBhcmFtIG1mYUNvZGVcbiAgICogQHBhcmFtIG1mYVR5cGUgLSBPcHRpb25hbCBwYXJhbWV0ZXIgKFNPRlRXQVJFX1RPS0VOX01GQSAvIFNNU19NRkEpXG4gICAqL1xuICBwdWJsaWMgc2VuZE1GQUNvZGUobWZhQ29kZSA6IHN0cmluZywgbWZhVHlwZSA6IHN0cmluZyA9IG51bGwpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgLy8gVE9ETzogZHluYW1pYyBjb2RlXG4gICAgLy8gU09GVFdBUkVfVE9LRU5fTUZBXG4gICAgLy8gU01TX01GQVxuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5zZW5kTUZBQ29kZShtZmFDb2RlLFxuICAgICAge1xuICAgICAgICBvblN1Y2Nlc3MgOiAoc2Vzc2lvbiA6IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJTZXNzaW9uKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5zZXRVc2VybmFtZShjb2duaXRvVXNlci5nZXRVc2VybmFtZSgpKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRva2VucyhzZXNzaW9uKTtcbiAgICAgICAgICB0aGlzLnNldFByb3ZpZGVyKEF1dGhUeXBlLkNPR05JVE8pO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ3JlZGVudGlhbHMoKTtcblxuICAgICAgICAgIHRoaXMub25TaWduSW4uZW1pdCgpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHNlc3Npb24pO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25GYWlsdXJlIDogKGVyciA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogc2VuZE1GQUNvZGUgLT4gc2VuZE1GQUNvZGUnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0sIG1mYVR5cGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdXNlcidzIE1GQSBzdGF0dXNcbiAgICovXG4gIHB1YmxpYyBnZXRNRkFPcHRpb25zKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5nZXRNRkFPcHRpb25zKChlcnIgOiBFcnJvciwgcmVzIDogQVdTQ29nbml0by5NRkFPcHRpb25bXSkgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHJlcyk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZ2V0TUZBT3B0aW9ucyAtPiBnZXRNRkFPcHRpb25zJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHVzZXIncyBNRkEgc3RhdHVzIChtdXN0IGhhdmUgYSBwaG9uZV9udW1iZXIgc2V0KVxuICAgKlxuICAgKiBAcGFyYW0gZW5hYmxlTWZhXG4gICAqL1xuICBwdWJsaWMgc2V0TWZhKGVuYWJsZU1mYSA6IGJvb2xlYW4pIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgaWYgKGVuYWJsZU1mYSlcbiAgICAgIHtcbiAgICAgICAgY29nbml0b1VzZXIuZW5hYmxlTUZBKChlcnIgOiBFcnJvciwgcmVzIDogc3RyaW5nKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHNldE1mYSAtPiBlbmFibGVNRkEnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBjb2duaXRvVXNlci5kaXNhYmxlTUZBKChlcnIgOiBFcnJvciwgcmVzIDogc3RyaW5nKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IHNldE1mYSAtPiBkaXNhYmxlTUZBJywgZXJyKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBQYXNzd29yZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IHBhc3N3b3JkIG9uIHRoZSBmaXJzdCBjb25uZWN0aW9uIChpZiBhIG5ldyBwYXNzd29yZCBpcyByZXF1aXJlZClcbiAgICpcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkXG4gICAqIEBwYXJhbSByZXF1aXJlZEF0dHJpYnV0ZURhdGEgLSBPcHRpb25hbCBwYXJhbWV0ZXJcbiAgICovXG4gIHB1YmxpYyBuZXdQYXNzd29yZFJlcXVpcmVkKG5ld1Bhc3N3b3JkIDogc3RyaW5nLCByZXF1aXJlZEF0dHJpYnV0ZURhdGEgOiBhbnkgPSB7fSkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5jb21wbGV0ZU5ld1Bhc3N3b3JkQ2hhbGxlbmdlKG5ld1Bhc3N3b3JkLCByZXF1aXJlZEF0dHJpYnV0ZURhdGEsXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzcyA6IChzZXNzaW9uIDogQVdTQ29nbml0by5Db2duaXRvVXNlclNlc3Npb24pID0+XG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRva2VucyhzZXNzaW9uKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBzZXNzaW9uKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmFpbHVyZSA6IChlcnIgOiBhbnkpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IG5ld1Bhc3N3b3JkUmVxdWlyZWQgLT4gY29tcGxldGVOZXdQYXNzd29yZENoYWxsZW5nZScsIGVycik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWZhUmVxdWlyZWQgOiAoY2hhbGxlbmdlTmFtZSA6IGFueSwgY2hhbGxlbmdlUGFyYW1ldGVycyA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk1GQV9SRVFVSVJFRCwgeyBjaGFsbGVuZ2VOYW1lIDogY2hhbGxlbmdlTmFtZSwgY2hhbGxlbmdlUGFyYW1ldGVycyA6IGNoYWxsZW5nZVBhcmFtZXRlcnMgfSk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBmb3Jnb3QgcGFzc3dvcmQgZmxvd1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICovXG4gIHB1YmxpYyBmb3Jnb3RQYXNzd29yZCh1c2VybmFtZSA6IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLnNldENvZ25pdG9Vc2VyKHVzZXJuYW1lKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLmZvcmdvdFBhc3N3b3JkKFxuICAgICAge1xuICAgICAgICBvblN1Y2Nlc3MgOiAoZGF0YSA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIC8vIE5PVEU6IG9uU3VjY2VzcyBpcyBjYWxsZWQgaWYgdGhlcmUgaXMgbm8gaW5wdXRWZXJpZmljYXRpb25Db2RlIGNhbGxiYWNrXG4gICAgICAgICAgLy8gTk9URTogaHR0cHM6Ly9naXRodWIuY29tL2FtYXpvbi1hcmNoaXZlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9pc3N1ZXMvMzI0XG4gICAgICAgICAgLy8gTk9URTogaHR0cHM6Ly9naXRodWIuY29tL2FtYXpvbi1hcmNoaXZlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9pc3N1ZXMvMzIzXG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgZGF0YSk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBvbkZhaWx1cmUgOiAoZXJyIDogRXJyb3IpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGZvcmdvdFBhc3N3b3JkIC0+IGZvcmdvdFBhc3N3b3JkJywgZXJyKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBpbnB1dFZlcmlmaWNhdGlvbkNvZGUgOiAoZGF0YSA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLklOUFVUX1ZFUklGSUNBVElPTl9DT0RFLCBkYXRhKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2VuZCB0aGUgZm9yZ290UGFzc3dvcmQgdmVyaWZpY2F0aW9uIGNvZGVcbiAgICovXG4gIHB1YmxpYyBnZXRBdHRyaWJ1dGVWZXJpZmljYXRpb25Db2RlKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBsZXQgbmFtZSA6IHN0cmluZyA9IG51bGw7XG4gICAgICBjb2duaXRvVXNlci5nZXRBdHRyaWJ1dGVWZXJpZmljYXRpb25Db2RlKG5hbWUsXG4gICAgICB7XG4gICAgICAgIG9uU3VjY2VzcyA6ICgpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBudWxsKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmFpbHVyZSA6IChlcnIgOiBFcnJvcikgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogZ2V0QXR0cmlidXRlVmVyaWZpY2F0aW9uQ29kZSAtPiBnZXRBdHRyaWJ1dGVWZXJpZmljYXRpb25Db2RlJywgZXJyKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBpbnB1dFZlcmlmaWNhdGlvbkNvZGUgOiAoZGF0YSA6IHN0cmluZykgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLklOUFVUX1ZFUklGSUNBVElPTl9DT0RFLCBkYXRhKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmlzaCBmb3Jnb3QgcGFzc3dvcmQgZmxvd1xuICAgKlxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmRcbiAgICogQHBhcmFtIHZlcmlmaWNhdGlvbkNvZGVcbiAgICovXG4gIHB1YmxpYyBjb25maXJtUGFzc3dvcmQobmV3UGFzc3dvcmQgOiBzdHJpbmcsIHZlcmlmaWNhdGlvbkNvZGUgOiBzdHJpbmcpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IGNvZ25pdG9Vc2VyID0gdGhpcy5nZXRDb2duaXRvVXNlcigpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b1VzZXIuY29uZmlybVBhc3N3b3JkKHZlcmlmaWNhdGlvbkNvZGUsIG5ld1Bhc3N3b3JkLFxuICAgICAge1xuICAgICAgICBvblN1Y2Nlc3MoKVxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgbnVsbCk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICB9LFxuICAgICAgICBvbkZhaWx1cmUgOiAoZXJyIDogRXJyb3IpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGNvbmZpcm1QYXNzd29yZCAtPiBjb25maXJtUGFzc3dvcmQnLCBlcnIpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIHVzZXIncyBwYXNzd29yZFxuICAgKlxuICAgKiBAcGFyYW0gb2xkUGFzc3dvcmRcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkXG4gICAqL1xuICBwdWJsaWMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQgOiBzdHJpbmcsIG5ld1Bhc3N3b3JkIDogc3RyaW5nKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGNvZ25pdG9Vc2VyLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCwgKGVyciA6IEVycm9yLCByZXMgOiBzdHJpbmcpID0+XG4gICAgICB7XG4gICAgICAgIGlmIChyZXMpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGNoYW5nZVBhc3N3b3JkIC0+IGNoYW5nZVBhc3N3b3JkJywgZXJyKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBBZG1pbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwdWJsaWMgYWRtaW5DcmVhdGVVc2VyKHVzZXJuYW1lIDogc3RyaW5nLCBwYXNzd29yZCA6IHN0cmluZykgOiBQcm9taXNlPEFXUy5BV1NFcnJvciB8IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5DcmVhdGVVc2VyUmVzcG9uc2U+XG4gIHtcbiAgICB0aGlzLnNldEFkbWluKCk7XG4gICAgbGV0IHBhcmFtcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5DcmVhdGVVc2VyUmVxdWVzdCA9IHtcbiAgICAgIFVzZXJQb29sSWQgICAgICAgIDogdGhpcy5wb29sRGF0YS5Vc2VyUG9vbElkLFxuICAgICAgVXNlcm5hbWUgICAgICAgICAgOiB1c2VybmFtZSxcbiAgICAgIFRlbXBvcmFyeVBhc3N3b3JkIDogcGFzc3dvcmRcbiAgICB9O1xuXG4gICAgbGV0IGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlciA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuYWRtaW5DcmVhdGVVc2VyKHBhcmFtcywgKGVyciA6IEFXUy5BV1NFcnJvciwgcmVzIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pbkNyZWF0ZVVzZXJSZXNwb25zZSkgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGFkbWluQ3JlYXRlVXNlciAtPiBhZG1pbkNyZWF0ZVVzZXInLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZG1pbkRlbGV0ZVVzZXIodXNlcm5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxBV1MuQVdTRXJyb3IgfCBhbnk+XG4gIHtcbiAgICB0aGlzLnNldEFkbWluKCk7XG4gICAgbGV0IHBhcmFtcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5EZWxldGVVc2VyUmVxdWVzdCA9IHtcbiAgICAgIFVzZXJQb29sSWQgOiB0aGlzLnBvb2xEYXRhLlVzZXJQb29sSWQsXG4gICAgICBVc2VybmFtZSAgIDogdXNlcm5hbWVcbiAgICB9O1xuXG4gICAgbGV0IGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlciA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuYWRtaW5EZWxldGVVc2VyKHBhcmFtcywgKGVyciA6IEFXUy5BV1NFcnJvciwgcmVzIDogYW55KSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogYWRtaW5EZWxldGVVc2VyIC0+IGFkbWluRGVsZXRlVXNlcicsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFkbWluUmVzZXRVc2VyUGFzc3dvcmQodXNlcm5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxBV1MuQVdTRXJyb3IgfCBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluUmVzZXRVc2VyUGFzc3dvcmRSZXNwb25zZT5cbiAge1xuICAgIHRoaXMuc2V0QWRtaW4oKTtcbiAgICBsZXQgcGFyYW1zIDogQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pblJlc2V0VXNlclBhc3N3b3JkUmVxdWVzdCA9IHtcbiAgICAgIFVzZXJQb29sSWQgOiB0aGlzLnBvb2xEYXRhLlVzZXJQb29sSWQsXG4gICAgICBVc2VybmFtZSAgIDogdXNlcm5hbWVcbiAgICB9O1xuXG4gICAgbGV0IGNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlciA9IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuYWRtaW5SZXNldFVzZXJQYXNzd29yZChwYXJhbXMsIChlcnIgOiBBV1MuQVdTRXJyb3IsIHJlcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5SZXNldFVzZXJQYXNzd29yZFJlc3BvbnNlKSA9PlxuICAgICAge1xuICAgICAgICBpZiAocmVzKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogYWRtaW5SZXNldFVzZXJQYXNzd29yZCAtPiBhZG1pblJlc2V0VXNlclBhc3N3b3JkJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcyh1c2VybmFtZSA6IHN0cmluZywgdXNlckF0dHJpYnV0ZXMgOiBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLlR5cGVzLkF0dHJpYnV0ZUxpc3RUeXBlKSA6IFByb21pc2U8QVdTLkFXU0Vycm9yIHwgQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzUmVzcG9uc2U+XG4gIHtcbiAgICB0aGlzLnNldEFkbWluKCk7XG4gICAgbGV0IHBhcmFtcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlc1JlcXVlc3QgPSB7XG4gICAgICBVc2VyUG9vbElkICAgICA6IHRoaXMucG9vbERhdGEuVXNlclBvb2xJZCxcbiAgICAgIFVzZXJuYW1lICAgICAgIDogdXNlcm5hbWUsXG4gICAgICBVc2VyQXR0cmlidXRlcyA6IHVzZXJBdHRyaWJ1dGVzXG4gICAgfTtcblxuICAgIGxldCBjb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIgPSBuZXcgQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlcigpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLmFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXMocGFyYW1zLCAoZXJyIDogQVdTLkFXU0Vycm9yLCByZXMgOiBBV1MuQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyLkFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXNSZXNwb25zZSkgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXMgLT4gYWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcycsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHJlc2V0RXhwaXJlZEFjY291bnQodXNlcm5hbWVLZXkgOiBzdHJpbmcsIHVzZXJuYW1lIDogc3RyaW5nKSA6IFByb21pc2U8QVdTLkFXU0Vycm9yIHwgQVdTLkNvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci5BZG1pblVwZGF0ZVVzZXJBdHRyaWJ1dGVzUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgYXR0cmlidXRlcyA6IEFXUy5Db2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIuQXR0cmlidXRlVHlwZVtdID0gW107XG4gICAgYXR0cmlidXRlcy5wdXNoKHsgTmFtZSA6IHVzZXJuYW1lS2V5LCBWYWx1ZSA6IHVzZXJuYW1lIH0pO1xuICAgIHJldHVybiB0aGlzLmFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXModXNlcm5hbWUsIGF0dHJpYnV0ZXMpO1xuICB9XG5cbiAgcHVibGljIHNldEFkbWluKCkgOiB2b2lkXG4gIHtcbiAgICBsZXQgY3JlZHMgPSBuZXcgQVdTLkNyZWRlbnRpYWxzKHRoaXMuYWRtaW5BY2Nlc3NLZXlJZCwgdGhpcy5hZG1pblNlY3JldEtleUlkKTtcbiAgICBBV1MuY29uZmlnLnJlZ2lvbiAgICAgID0gdGhpcy5yZWdpb247XG4gICAgQVdTLmNvbmZpZy5jcmVkZW50aWFscyA9IGNyZWRzO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IEF1dGhlbnRpY2F0aW9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IGFuIGV4aXN0aW5nIHVzZXJcbiAgICpcbiAgICogQHBhcmFtIHByb3ZpZGVyIC0gVXNlIHRoZSBBdXRoVHlwZSBlbnVtIHRvIHNlbmQgYW4gYXV0aG9yaXplZCBhdXRoZW50aWNhdGlvbiBwcm92aWRlclxuICAgKiBAcGFyYW0gdXNlcm5hbWVcbiAgICogQHBhcmFtIHBhc3N3b3JkXG4gICAqL1xuICBwdWJsaWMgc2lnbkluKHByb3ZpZGVyIDogc3RyaW5nLCB1c2VybmFtZSA/OiBzdHJpbmcsIHBhc3N3b3JkID86IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBzd2l0Y2ggKHByb3ZpZGVyKVxuICAgIHtcbiAgICAgIGNhc2UgQXV0aFR5cGUuQ09HTklUTyA6XG4gICAgICAgIHJldHVybiB0aGlzLmF1dGhlbnRpY2F0ZUNvZ25pdG9Vc2VyKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICBjYXNlIEF1dGhUeXBlLkdPT0dMRSA6XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxHb29nbGUoR29vZ2xlQWN0aW9uLkFVVEhFTlRJQ0FURSk7XG4gICAgICBkZWZhdWx0IDpcbiAgICAgICAgbGV0IGVycm9yID0gJ1Byb3ZpZGVyIG5vdCByZWNvZ25pemVkIDogdXNlIHRoZSBBdXRoVHlwZSBlbnVtIHRvIHNlbmQgYW4gYXV0aG9yaXplZCBhdXRoZW50aWNhdGlvbiBwcm92aWRlcic7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChyZXNwb25zZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYSB1c2VyJ3Mgc2Vzc2lvbiAocmV0cmlldmUgcmVmcmVzaGVkIHRva2VucylcbiAgICovXG4gIHB1YmxpYyByZWZyZXNoU2Vzc2lvbigpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IHByb3ZpZGVyIDogc3RyaW5nID0gbnVsbDtcbiAgICBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIoKTtcblxuICAgIHN3aXRjaCAocHJvdmlkZXIpXG4gICAge1xuICAgICAgY2FzZSBBdXRoVHlwZS5DT0dOSVRPIDpcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmcmVzaENvZ25pdG9TZXNzaW9uKCk7XG4gICAgICBjYXNlIEF1dGhUeXBlLkdPT0dMRSA6XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxHb29nbGUoR29vZ2xlQWN0aW9uLlJFRlJFU0gpO1xuICAgICAgZGVmYXVsdCA6XG4gICAgICAgIGxldCBlcnJvciA9ICdQcm92aWRlciBub3QgcmVjb2duaXplZCA6IHRoZSB1c2VyIG11c3QgYmUgbG9nZ2VkIGluIGJlZm9yZSB1cGRhdGluZyB0aGUgc2Vzc2lvbic7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChyZXNwb25zZSk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNpZ25PdXQoKSA6IHZvaWRcbiAge1xuICAgIGxldCBwcm92aWRlciA6IHN0cmluZyA9IG51bGw7XG4gICAgcHJvdmlkZXIgPSB0aGlzLmdldFByb3ZpZGVyKCk7XG5cbiAgICBzd2l0Y2ggKHByb3ZpZGVyKVxuICAgIHtcbiAgICAgIGNhc2UgQXV0aFR5cGUuQ09HTklUTyA6XG4gICAgICAgIHRoaXMuc2lnbk91dENvZ25pdG8oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEF1dGhUeXBlLkdPT0dMRSA6XG4gICAgICAgIHRoaXMuY2FsbEdvb2dsZShHb29nbGVBY3Rpb24uTE9HT1VUKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0IDpcbiAgICAgICAgY29uc29sZS5lcnJvcignUHJvdmlkZXIgbm90IHJlY29nbml6ZWQgOiB0aGUgdXNlciBtdXN0IGJlIGxvZ2dlZCBpbiBiZWZvcmUgbG9nZ2luZyBvdXQnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdGhpcy5vblNpZ25PdXQuZW1pdCgpO1xuICAgIHRoaXMuY2xlYXJTdG9yYWdlKCk7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gU0VDVElPTjogQ29nbml0byAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBhdXRoZW50aWNhdGVDb2duaXRvVXNlcih1c2VybmFtZSA6IHN0cmluZywgcGFzc3dvcmQgOiBzdHJpbmcpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IGF1dGhlbnRpY2F0aW9uRGF0YSA6IEFXU0NvZ25pdG8uSUF1dGhlbnRpY2F0aW9uRGV0YWlsc0RhdGEgPSB7XG4gICAgICBVc2VybmFtZSA6IHVzZXJuYW1lLFxuICAgICAgUGFzc3dvcmQgOiBwYXNzd29yZFxuICAgIH07XG4gICAgbGV0IGF1dGhlbnRpY2F0aW9uRGV0YWlscyA9IG5ldyBBV1NDb2duaXRvLkF1dGhlbnRpY2F0aW9uRGV0YWlscyhhdXRoZW50aWNhdGlvbkRhdGEpO1xuICAgIGxldCBjb2duaXRvVXNlciA9IHRoaXMuZ2V0Q29nbml0b1VzZXIodXNlcm5hbWUpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAge1xuICAgICAgY29nbml0b1VzZXIuYXV0aGVudGljYXRlVXNlcihhdXRoZW50aWNhdGlvbkRldGFpbHMsXG4gICAgICB7XG4gICAgICAgIG5ld1Bhc3N3b3JkUmVxdWlyZWQgOiAodXNlckF0dHJpYnV0ZXMgOiBhbnksIHJlcXVpcmVkQXR0cmlidXRlcyA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIHRoaXMuY29nbml0b1VzZXIgPSBjb2duaXRvVXNlcjsgLy8gTk9URTogaHR0cHM6Ly9naXRodWIuY29tL2FtYXpvbi1hcmNoaXZlcy9hbWF6b24tY29nbml0by1pZGVudGl0eS1qcy9pc3N1ZXMvMzY1XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuTkVXX1BBU1NXT1JEX1JFUVVJUkVELCB7IHVzZXJBdHRyaWJ1dGVzIDogdXNlckF0dHJpYnV0ZXMsIHJlcXVpcmVkQXR0cmlidXRlcyA6IHJlcXVpcmVkQXR0cmlidXRlcyB9KTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uU3VjY2VzcyA6IChzZXNzaW9uIDogQVdTQ29nbml0by5Db2duaXRvVXNlclNlc3Npb24pID0+XG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLnNldFVzZXJuYW1lKHVzZXJuYW1lKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRva2VucyhzZXNzaW9uKTtcbiAgICAgICAgICB0aGlzLnNldFByb3ZpZGVyKEF1dGhUeXBlLkNPR05JVE8pO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ3JlZGVudGlhbHMoKTtcblxuICAgICAgICAgIHRoaXMub25TaWduSW4uZW1pdCgpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX1NVQ0NFU1MsIHNlc3Npb24pO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25GYWlsdXJlIDogKGVycikgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogYXV0aGVudGljYXRlQ29nbml0b1VzZXIgLT4gYXV0aGVudGljYXRlVXNlcicsIGVycik7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWZhU2V0dXAgOiAoY2hhbGxlbmdlTmFtZSA6IGFueSwgY2hhbGxlbmdlUGFyYW1ldGVycyA6IGFueSkgPT5cbiAgICAgICAge1xuICAgICAgICAgIGNvZ25pdG9Vc2VyLmFzc29jaWF0ZVNvZnR3YXJlVG9rZW4oXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXNzb2NpYXRlU2VjcmV0Q29kZSA6IChzZWNyZXRDb2RlIDogc3RyaW5nKSA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5NRkFfU0VUVVBfQVNTT0NJQVRFX1NFQ1JFVEVfQ09ERSwgc2VjcmV0Q29kZSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUgOiAoZXJyKSA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5NRkFfU0VUVVBfT05fRkFJTFVSRSwgZXJyKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG1mYVJlcXVpcmVkIDogKGNoYWxsZW5nZU5hbWUgOiBhbnksIGNoYWxsZW5nZVBhcmFtZXRlcnMgOiBhbnkpID0+XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5NRkFfUkVRVUlSRUQsIHsgY2hhbGxlbmdlTmFtZSA6IGNoYWxsZW5nZU5hbWUsIGNoYWxsZW5nZVBhcmFtZXRlcnMgOiBjaGFsbGVuZ2VQYXJhbWV0ZXJzIH0pO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hDb2duaXRvU2Vzc2lvbigpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IHRva2VucyAgICAgICA9IHRoaXMuZ2V0VG9rZW5zKCk7XG4gICAgbGV0IGNvZ25pdG9Vc2VyICA9IHRoaXMuZ2V0Q29nbml0b1VzZXIoKTtcbiAgICBsZXQgcmVmcmVzaFRva2VuID0gbmV3IEFXU0NvZ25pdG8uQ29nbml0b1JlZnJlc2hUb2tlbih7IFJlZnJlc2hUb2tlbiA6IHRva2Vucy5yZWZyZXNoVG9rZW4gfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICB7XG4gICAgICBjb2duaXRvVXNlci5yZWZyZXNoU2Vzc2lvbihyZWZyZXNoVG9rZW4sIChlcnIgOiBhbnksIHJlcyA6IGFueSkgPT5cbiAgICAgIHtcbiAgICAgICAgaWYgKHJlcylcbiAgICAgICAge1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9rZW5zKHJlcyk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDcmVkZW50aWFscygpO1xuXG4gICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgcmVzKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiByZWZyZXNoU2Vzc2lvbiAtPiByZWZyZXNoU2Vzc2lvbicsIGVycik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNpZ25PdXRDb2duaXRvKCkgOiB2b2lkXG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgPSB0aGlzLmdldENvZ25pdG9Vc2VyKCk7XG4gICAgaWYgKGNvZ25pdG9Vc2VyKVxuICAgICAgY29nbml0b1VzZXIuc2lnbk91dCgpO1xuICB9XG5cbiAgLy8gIVNFQ1RJT05cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFNFQ1RJT046IEdvb2dsZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByaXZhdGUgaW5pdEdvb2dsZSgpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgbGV0IHBhcmFtcyAgOiBnYXBpLmF1dGgyLkNsaWVudENvbmZpZyA9IHtcbiAgICAgIGNsaWVudF9pZCA6IHRoaXMuZ29vZ2xlSWQsXG4gICAgICBzY29wZSAgICAgOiB0aGlzLmdvb2dsZVNjb3BlXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGdhcGkubG9hZCgnYXV0aDInLFxuICAgICAge1xuICAgICAgICBjYWxsYmFjayAgOiBfID0+XG4gICAgICAgIHtcbiAgICAgICAgICBnYXBpLmF1dGgyLmluaXQocGFyYW1zKS50aGVuKChnb29nbGVBdXRoIDogZ2FwaS5hdXRoMi5Hb29nbGVBdXRoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuZ29vZ2xlQXV0aCA9IGdvb2dsZUF1dGg7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCBnb29nbGVBdXRoKTtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIChyZWFzb24gOiB7IGVycm9yIDogc3RyaW5nLCBkZXRhaWxzIDogc3RyaW5nIH0pID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBpbml0R29vZ2xlIC0+IEdvb2dsZUF1dGgnLCByZWFzb24pO1xuICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgcmVhc29uKTtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBvbmVycm9yICAgOiBfID0+XG4gICAgICAgIHsgLy8gSGFuZGxlIGxvYWRpbmcgZXJyb3JcbiAgICAgICAgICBsZXQgZXJyb3IgPSAnZ2FwaS5jbGllbnQgZmFpbGVkIHRvIGxvYWQnO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvZ25pdG9TZXJ2aWNlIDogaW5pdEdvb2dsZSAtPiBsb2FkJywgZXJyb3IpO1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0VSUk9SLCBlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVvdXQgICA6IDUwMDAsIC8vIDUgc2Vjb25kc1xuICAgICAgICBvbnRpbWVvdXQgOiBfID0+XG4gICAgICAgIHsgLy8gSGFuZGxlIHRpbWVvdXRcbiAgICAgICAgICBsZXQgZXJyb3IgPSAnZ2FwaS5jbGllbnQgY291bGQgbm90IGxvYWQgaW4gYSB0aW1lbHkgbWFubmVyJztcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvU2VydmljZSA6IGluaXRHb29nbGUgLT4gbG9hZCcsIGVycm9yKTtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9USU1FT1VULCBlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxsR29vZ2xlKGFjdGlvbiA6IHN0cmluZykgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBpZiAodGhpcy5nb29nbGVBdXRoKVxuICAgIHtcbiAgICAgIHJldHVybiB0aGlzLm1ha2VHb29nbGUoYWN0aW9uKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAge1xuICAgICAgICB0aGlzLmluaXRHb29nbGUoKS50aGVuKF8gPT5cbiAgICAgICAge1xuICAgICAgICAgIHRoaXMubWFrZUdvb2dsZShhY3Rpb24pLnRoZW4ocmVzID0+IHJlc29sdmUocmVzKSkuY2F0Y2goZXJyID0+IHJlamVjdChlcnIpKTtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT5cbiAgICAgICAge1xuICAgICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycm9yKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWFrZUdvb2dsZShhY3Rpb24gOiBzdHJpbmcpIDogUHJvbWlzZTxDb2duaXRvU2VydmljZVJlc3BvbnNlPlxuICB7XG4gICAgc3dpdGNoIChhY3Rpb24pXG4gICAge1xuICAgICAgY2FzZSBHb29nbGVBY3Rpb24uQVVUSEVOVElDQVRFIDpcbiAgICAgICAgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlR29vZ2xlVXNlcigpO1xuICAgICAgY2FzZSBHb29nbGVBY3Rpb24uUkVGUkVTSCA6XG4gICAgICAgIHJldHVybiB0aGlzLnJlZnJlc2hHb29nbGVTZXNzaW9uKCk7XG4gICAgICBjYXNlIEdvb2dsZUFjdGlvbi5MT0dPVVQgOlxuICAgICAgICB0aGlzLnNpZ25PdXRHb29nbGUoKTtcbiAgICAgICAgbGV0IGxvZ291dFJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgbnVsbCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobG9nb3V0UmVzcG9uc2UpO1xuICAgICAgZGVmYXVsdCA6XG4gICAgICAgIGxldCBlcnJvciA9ICdHb29nbGUgYWN0aW9uIG5vdCByZWNvZ25pemVkIDogYXV0aGVudGljYXRlIC8gcmVmcmVzaCAvIGxvZ291dCc7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICBsZXQgZGVmYXVsdFJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fRkFJTFVSRSwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZGVmYXVsdFJlc3BvbnNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGF1dGhlbnRpY2F0ZUdvb2dsZVVzZXIoKSA6IFByb21pc2U8Q29nbml0b1NlcnZpY2VSZXNwb25zZT5cbiAge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGxldCBvcHRpb25zIDogZ2FwaS5hdXRoMi5TaWduaW5PcHRpb25zID0ge1xuICAgICAgICBzY29wZSA6IHRoaXMuZ29vZ2xlU2NvcGVcbiAgICAgIH07XG4gICAgICB0aGlzLmdvb2dsZUF1dGguc2lnbkluKG9wdGlvbnMpLnRoZW4oKGdvb2dsZVVzZXIgOiBnYXBpLmF1dGgyLkdvb2dsZVVzZXIpID0+XG4gICAgICB7XG4gICAgICAgIGxldCBnb29nbGVSZXNwb25zZSA9IGdvb2dsZVVzZXIuZ2V0QXV0aFJlc3BvbnNlKCk7XG4gICAgICAgIGxldCBnb29nbGVQcm9maWxlICA9IGdvb2dsZVVzZXIuZ2V0QmFzaWNQcm9maWxlKCk7XG5cbiAgICAgICAgdGhpcy5zZXRVc2VybmFtZShnb29nbGVQcm9maWxlLmdldE5hbWUoKSk7XG4gICAgICAgIHRoaXMuc2V0SWRUb2tlbihnb29nbGVSZXNwb25zZS5pZF90b2tlbik7XG4gICAgICAgIHRoaXMuc2V0RXhwaXJlc0F0KGdvb2dsZVJlc3BvbnNlLmV4cGlyZXNfYXQpO1xuICAgICAgICB0aGlzLnNldFByb3ZpZGVyKEF1dGhUeXBlLkdPT0dMRSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ3JlZGVudGlhbHMoKTtcblxuICAgICAgICB0aGlzLm9uU2lnbkluLmVtaXQoKTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gbmV3IENvZ25pdG9TZXJ2aWNlUmVzcG9uc2UoUmVzcFR5cGUuT05fU1VDQ0VTUywgZ29vZ2xlUHJvZmlsZSk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgIH0sIChvblJlamVjdGVkIDogYW55KSA9PlxuICAgICAge1xuICAgICAgICAvLyBDYW4gYmUgOiBwb3B1cF9ibG9ja2VkX2J5X2Jyb3dzZXJcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBhdXRoZW50aWNhdGVHb29nbGVVc2VyIC0+IHNpZ25JbicsIG9uUmVqZWN0ZWQpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9SRUpFQ1RFRCwgb25SZWplY3RlZCk7XG4gICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSkuY2F0Y2goKGVycikgPT5cbiAgICAgIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiBhdXRoZW50aWNhdGVHb29nbGVVc2VyIC0+IHNpZ25JbicsIGVycik7XG4gICAgICAgIGxldCByZXNwb25zZSA9IG5ldyBDb2duaXRvU2VydmljZVJlc3BvbnNlKFJlc3BUeXBlLk9OX0ZBSUxVUkUsIGVycik7XG4gICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hHb29nbGVTZXNzaW9uKCkgOiBQcm9taXNlPENvZ25pdG9TZXJ2aWNlUmVzcG9uc2U+XG4gIHtcbiAgICBsZXQgZ29vZ2xlVXNlciA6IGdhcGkuYXV0aDIuR29vZ2xlVXNlciA9IG51bGw7XG4gICAgZ29vZ2xlVXNlciA9IHRoaXMuZ29vZ2xlQXV0aC5jdXJyZW50VXNlci5nZXQoKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHtcbiAgICAgIGdvb2dsZVVzZXIucmVsb2FkQXV0aFJlc3BvbnNlKCkudGhlbigocmVzIDogZ2FwaS5hdXRoMi5BdXRoUmVzcG9uc2UpID0+XG4gICAgICB7XG4gICAgICAgIHRoaXMuc2V0SWRUb2tlbihyZXMuaWRfdG9rZW4pO1xuICAgICAgICB0aGlzLnNldEV4cGlyZXNBdChyZXMuZXhwaXJlc19hdCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ3JlZGVudGlhbHMoKTtcblxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9TVUNDRVNTLCByZXMpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT5cbiAgICAgIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ29nbml0b1NlcnZpY2UgOiByZWZyZXNoR29vZ2xlU2Vzc2lvbiAtPiByZWxvYWRBdXRoUmVzcG9uc2UnLCBlcnIpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgQ29nbml0b1NlcnZpY2VSZXNwb25zZShSZXNwVHlwZS5PTl9GQUlMVVJFLCBlcnIpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzaWduT3V0R29vZ2xlKCkgOiB2b2lkXG4gIHtcbiAgICB0aGlzLmdvb2dsZUF1dGguc2lnbk91dCgpLnRoZW4oXyA9PlxuICAgIHtcbiAgICAgIHRoaXMuZ29vZ2xlQXV0aC5kaXNjb25uZWN0KCk7XG4gICAgfSk7XG4gIH1cblxuICAvLyAhU0VDVElPTlxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gVE9ETzogRmFjZWJvb2sgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBTRUNUSU9OOiBQcml2YXRlIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOT1RFOiBVc2VyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBzZXRDb2duaXRvVXNlcih1c2VybmFtZSA6IHN0cmluZykgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyXG4gIHtcbiAgICBsZXQgY29nbml0b1VzZXIgOiBBV1NDb2duaXRvLkNvZ25pdG9Vc2VyID0gbnVsbDtcbiAgICBsZXQgY29nbml0b1VzZXJQb29sID0gbmV3IEFXU0NvZ25pdG8uQ29nbml0b1VzZXJQb29sKHRoaXMucG9vbERhdGEpO1xuXG4gICAgbGV0IHVzZXJEYXRhIDogQVdTQ29nbml0by5JQ29nbml0b1VzZXJEYXRhID0ge1xuICAgICAgVXNlcm5hbWUgICA6IHVzZXJuYW1lLFxuICAgICAgUG9vbCAgICAgICA6IGNvZ25pdG9Vc2VyUG9vbFxuICAgIH07XG4gICAgY29nbml0b1VzZXIgPSBuZXcgQVdTQ29nbml0by5Db2duaXRvVXNlcih1c2VyRGF0YSk7XG5cbiAgICB0aGlzLmNvZ25pdG9Vc2VyID0gY29nbml0b1VzZXI7IC8vIFN0b3JlIHRoZSB1c2VyIGluIHRoZSBzZXJ2aWNlXG4gICAgdGhpcy5zZXRVc2VybmFtZSh1c2VybmFtZSk7IC8vIFN0b3JlIHRoZSB1c2VybmFtZSBpbiB0aGUgbG9jYWwgc3RvcmFnZVxuXG4gICAgcmV0dXJuIGNvZ25pdG9Vc2VyO1xuICB9XG5cbiAgLy8gTk9URTogU2Vzc2lvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByaXZhdGUgc2V0RXhwaXJlc0F0KGV4cGlyZXNBdCA6IG51bWJlcikgOiB2b2lkXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdFeHBpcmVzQXQnO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIGV4cGlyZXNBdC50b1N0cmluZygpKTtcbiAgfVxuXG4gIC8vIE5PVEU6IFVzZXJuYW1lIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcml2YXRlIHNldFVzZXJuYW1lKHVzZXJuYW1lIDogc3RyaW5nKSA6IHZvaWRcbiAge1xuICAgIGxldCBzdG9yYWdlS2V5IDogc3RyaW5nID0gbnVsbDtcbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ1VzZXJuYW1lJztcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCB1c2VybmFtZSk7XG4gIH1cblxuICAvLyBOT1RFOiBQcm92aWRlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJpdmF0ZSBzZXRQcm92aWRlcihwcm92aWRlciA6IHN0cmluZykgOiB2b2lkXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdQcm92aWRlcic7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgcHJvdmlkZXIpO1xuICB9XG5cbiAgLy8gTk9URTogVG9rZW4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByaXZhdGUgc2V0SWRUb2tlbih0b2tlbiA6IHN0cmluZykgOiB2b2lkXG4gIHtcbiAgICBsZXQgc3RvcmFnZUtleSA6IHN0cmluZyA9IG51bGw7XG4gICAgc3RvcmFnZUtleSA9IHRoaXMuc3RvcmFnZVByZWZpeCArICdJZFRva2VuJztcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCB0b2tlbik7XG4gIH1cblxuICBwcml2YXRlIHNldFRva2VucyhzZXNzaW9uIDogQVdTQ29nbml0by5Db2duaXRvVXNlclNlc3Npb24pIDogdm9pZFxuICB7XG4gICAgbGV0IHN0b3JhZ2VLZXkgOiBzdHJpbmcgPSBudWxsO1xuICAgIGxldCB0b2tlbnNTdHIgIDogc3RyaW5nID0gbnVsbDtcbiAgICBsZXQgdG9rZW5zT2JqICA6IGFueSAgICA9IG51bGw7XG5cbiAgICBzdG9yYWdlS2V5ID0gdGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Nlc3Npb25Ub2tlbnMnO1xuICAgIHRva2Vuc09iaiAgPSB7XG4gICAgICBhY2Nlc3NUb2tlbiAgICAgICAgICA6IHNlc3Npb24uZ2V0QWNjZXNzVG9rZW4oKS5nZXRKd3RUb2tlbigpLFxuICAgICAgYWNjZXNzVG9rZW5FeHBpcmVzQXQgOiBzZXNzaW9uLmdldEFjY2Vzc1Rva2VuKCkuZ2V0RXhwaXJhdGlvbigpICogMTAwMCwgLy8gU2Vjb25kcyB0byBtaWxsaXNlY29uZHNcbiAgICAgIGlkVG9rZW4gICAgICAgICAgICAgIDogc2Vzc2lvbi5nZXRJZFRva2VuKCkuZ2V0Snd0VG9rZW4oKSxcbiAgICAgIGlkVG9rZW5FeHBpcmVzQXQgICAgIDogc2Vzc2lvbi5nZXRJZFRva2VuKCkuZ2V0RXhwaXJhdGlvbigpICogMTAwMCwgLy8gU2Vjb25kcyB0byBtaWxsaXNlY29uZHNcbiAgICAgIHJlZnJlc2hUb2tlbiAgICAgICAgIDogc2Vzc2lvbi5nZXRSZWZyZXNoVG9rZW4oKS5nZXRUb2tlbigpXG4gICAgfTtcbiAgICB0b2tlbnNTdHIgPSBKU09OLnN0cmluZ2lmeSh0b2tlbnNPYmopO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIHRva2Vuc1N0cik7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVRva2VucyhzZXNzaW9uIDogQVdTQ29nbml0by5Db2duaXRvVXNlclNlc3Npb24pIDogdm9pZFxuICB7XG4gICAgbGV0IHRva2VucyA6IGFueSA9IG51bGw7XG4gICAgdGhpcy5zZXRUb2tlbnMoc2Vzc2lvbik7XG4gICAgdG9rZW5zID0gdGhpcy5nZXRUb2tlbnMoKTtcbiAgICB0aGlzLnNldElkVG9rZW4odG9rZW5zLmlkVG9rZW4pO1xuICAgIHRoaXMuc2V0RXhwaXJlc0F0KHRva2Vucy5pZFRva2VuRXhwaXJlc0F0KTtcbiAgfVxuXG4gIC8vIE5PVEU6IFN0b3JhZ2UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcml2YXRlIGNsZWFyU3RvcmFnZSgpIDogdm9pZFxuICB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5zdG9yYWdlUHJlZml4ICsgJ1VzZXJuYW1lJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Byb3ZpZGVyJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5zdG9yYWdlUHJlZml4ICsgJ0lkVG9rZW4nKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnN0b3JhZ2VQcmVmaXggKyAnRXhwaXJlc0F0Jyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5zdG9yYWdlUHJlZml4ICsgJ1Nlc3Npb25Ub2tlbnMnKTtcbiAgfVxuXG4gIC8vICFTRUNUSU9OXG5cbn1cbiJdfQ==
