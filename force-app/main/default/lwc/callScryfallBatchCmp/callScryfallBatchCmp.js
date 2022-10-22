import { LightningElement } from 'lwc';
import runBatch from '@salesforce/apex/CardSearchController.runBatch';

export default class CallScryfallBatchCmp extends LightningElement {
    connectedCallback() {
        runBatch()
            .then(result => {
                console.log('Batch ran.');
            })
            .catch(error => {
                console.log(error);
            });
    }
}