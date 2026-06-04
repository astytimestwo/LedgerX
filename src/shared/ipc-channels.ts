export const IPC = {
    PING: 'ping',
    AUTH: {
        LOGIN: 'auth:login',
        SETUP_TOTP: 'auth:setupTotp',
        VERIFY_TOTP: 'auth:verifyTotp',
        CREATE_COMPANY: 'auth:createCompany',
        CHECK_FIRST_RUN: 'auth:checkFirstRun',
        GET_COMPANIES: 'auth:getCompanies',
        UNLOCK_COMPANY: 'auth:unlockCompany'
    },
    LEDGER: {
        CREATE_GROUP: 'ledger:createGroup',
        UPDATE_GROUP: 'ledger:updateGroup',
        DELETE_GROUP: 'ledger:deleteGroup',
        CREATE_ACCOUNT: 'ledger:createAccount',
        UPDATE_ACCOUNT: 'ledger:updateAccount',
        DELETE_ACCOUNT: 'ledger:deleteAccount',
        GET_GROUPS: 'ledger:getGroups',
        GET_ACCOUNTS: 'ledger:getAccounts'
    }
} as const;
