import { EventEmitter } from '@angular/core';
import * as AWSCognito from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';
import * as awsservice from 'aws-sdk/lib/service';
import { CognitoServiceResponse } from './models/cognito-service-response.model';
export declare enum GoogleAction {
    AUTHENTICATE = "authenticate",
    REFRESH = "refresh",
    LOGOUT = "logout"
}
export declare class CognitoService {
    cognitoConst: any;
    onSignIn: EventEmitter<null>;
    onSignOut: EventEmitter<null>;
    private storagePrefix;
    private googleId;
    private googleScope;
    private poolData;
    private identityPool;
    private region;
    private adminAccessKeyId;
    private adminSecretKeyId;
    private googleAuth;
    private cognitoUser;
    constructor(cognitoConst: any);
    isAuthenticated(): boolean;
    sts(): Promise<AWS.STS.GetCallerIdentityResponse | AWS.AWSError>;
    autoRefreshSession(): void;
    getRemaining(): number;
    getExpiresAt(): Date;
    getUsername(): string;
    getProvider(): string;
    getIdToken(): string;
    getTokens(): any;
    initCredentials(): void;
    getCredentials(): Promise<any>;
    updateCredentials(clientConfig?: awsservice.ServiceConfigurationOptions): void;
    getCognitoUser(username?: string): AWSCognito.CognitoUser;
    getUserAttributes(): any;
    deleteAttributes(attributeList: string[]): any;
    getUserData(): any;
    deleteUser(): any;
    /**
     * Register a new user
     *
     * @param username
     * @param password
     * @param userAttributes - Optional parameter
     * @param validationData - Optional parameter
     */
    signUp(username: string, password: string, userAttributes?: AWSCognito.CognitoUserAttribute[], validationData?: AWSCognito.CognitoUserAttribute[]): Promise<CognitoServiceResponse>;
    /**
     * Confirm the signUp action
     *
     * @param verificationCode
     * @param forceAliasCreation - Optional parameter
     */
    confirmRegistration(verificationCode: string, forceAliasCreation?: boolean): Promise<CognitoServiceResponse>;
    /**
     * Resend the signUp confirmation code
     */
    resendConfirmationCode(): Promise<CognitoServiceResponse>;
    /**
     * Login 2nd step for users with MFA enabled
     *
     * @param mfaCode
     * @param mfaType - Optional parameter (SOFTWARE_TOKEN_MFA / SMS_MFA)
     */
    sendMFACode(mfaCode: string, mfaType?: string): Promise<CognitoServiceResponse>;
    /**
     * Return the user's MFA status
     */
    getMFAOptions(): Promise<CognitoServiceResponse>;
    /**
     * Return the user's MFA status (must have a phone_number set)
     *
     * @param enableMfa
     */
    setMfa(enableMfa: boolean): Promise<CognitoServiceResponse>;
    /**
     * Set a new password on the first connection (if a new password is required)
     *
     * @param newPassword
     * @param requiredAttributeData - Optional parameter
     */
    newPasswordRequired(newPassword: string, requiredAttributeData?: any): Promise<CognitoServiceResponse>;
    /**
     * Initiate forgot password flow
     *
     * @param username
     */
    forgotPassword(username: string): Promise<CognitoServiceResponse>;
    /**
     * Resend the forgotPassword verification code
     */
    getAttributeVerificationCode(): Promise<CognitoServiceResponse>;
    /**
     * Finish forgot password flow
     *
     * @param newPassword
     * @param verificationCode
     */
    confirmPassword(newPassword: string, verificationCode: string): Promise<CognitoServiceResponse>;
    /**
     * Update a user's password
     *
     * @param oldPassword
     * @param newPassword
     */
    changePassword(oldPassword: string, newPassword: string): Promise<CognitoServiceResponse>;
    adminCreateUser(username: string, password: string, email: string, promotionId: string, clientList: string, firstName: string, lastName: string, onlineSubmission: string, resubmission: string): Promise<AWS.AWSError | AWS.CognitoIdentityServiceProvider.AdminCreateUserResponse>;
    adminAddUserToGroup(username: string, groupname: string): Promise<AWS.AWSError | AWS.CognitoIdentityServiceProvider.AdminCreateUserResponse>;
    listGroups(): Promise<AWS.AWSError | any>;
    listUsers(): Promise<AWS.AWSError | any>;
    adminEnableUser(username: string): Promise<AWS.AWSError | any>;
    adminDisableUser(username: string): Promise<AWS.AWSError | any>;
    adminDeleteUser(username: string): Promise<AWS.AWSError | any>;
    adminGetUser(username: string): Promise<AWS.AWSError | any>;
    adminListGroupsForUser(username: string,limit:number): Promise<AWS.AWSError | any>;
    adminResetUserPassword(username: string): Promise<AWS.AWSError | AWS.CognitoIdentityServiceProvider.AdminResetUserPasswordResponse>;
    adminUpdateUserAttributes(username: string, userAttributes: AWS.CognitoIdentityServiceProvider.Types.AttributeListType): Promise<AWS.AWSError | AWS.CognitoIdentityServiceProvider.AdminUpdateUserAttributesResponse>;
    resetExpiredAccount(usernameKey: string, username: string): Promise<AWS.AWSError | AWS.CognitoIdentityServiceProvider.AdminUpdateUserAttributesResponse>;
    setAdmin(): void;
    /**
     * Connect an existing user
     *
     * @param provider - Use the AuthType enum to send an authorized authentication provider
     * @param username
     * @param password
     */
    signIn(provider: string, username?: string, password?: string): Promise<CognitoServiceResponse>;
    /**
     * Refresh a user's session (retrieve refreshed tokens)
     */
    refreshSession(): Promise<CognitoServiceResponse>;
    signOut(): void;
    private authenticateCognitoUser;
    private refreshCognitoSession;
    private signOutCognito;
    private initGoogle;
    private callGoogle;
    private makeGoogle;
    private authenticateGoogleUser;
    private refreshGoogleSession;
    private signOutGoogle;
    private setCognitoUser;
    private setExpiresAt;
    private setUsername;
    private setProvider;
    private setIdToken;
    private setTokens;
    private updateTokens;
    private clearStorage;
}
