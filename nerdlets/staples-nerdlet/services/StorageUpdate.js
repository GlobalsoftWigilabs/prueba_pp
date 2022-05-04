import {
    AccountStorageMutation,
    AccountsQuery,
    AccountStorageQuery
} from 'nr1';
import { NerdGraphQuery } from 'nr1';

import Canary from "../config/canary_states.json";


export default class StorageUpdate {
    constructor() {
        this.loading = false;
        this.dataCanary = Canary;
        this.getAccountId();
    }

    update(data) {
        this.loading = true;
        this.saveCanaryData(data)
        this.loading = false;
    }

    getAccountId() {
        let accountId = null;
        AccountsQuery.query()
            .then(({ data }) => {
                accountId = data[0].id;
                this.accountId = accountId;
                this.getCanaryData();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    getCanaryData() {
        // Read a document
        AccountStorageQuery.query({
            accountId: this.accountId,
            collection: 'pp',
            documentId: 'dataCanary',
        }).then(({ data }) => {
            if (data != null) {
                // IF data Exist
                console.log('READ CANARY DATA');
                this.dataCanary = data.dataCanary;

            } 
            //console.table(this.dataCanary);
        });
    }

    saveCanaryData(data) {
        // Write a document
        AccountStorageMutation.mutate({
            accountId: this.accountId,
            actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
            collection: 'pp',
            documentId: 'dataCanary',
            document: {
                dataCanary: data
            },
        }).then(({ data }) => {
            console.log('SAVE CANARY DATA');
           // console.log(data.nerdStorageWriteDocument.dataCanary);
        });
    }

    getLoadData(){
        return this.dataCanary;
    }
}