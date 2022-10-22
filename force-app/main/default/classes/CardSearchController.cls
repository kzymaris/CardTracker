public with sharing class CardSearchController {

    @AuraEnabled
    public static string doScryfallSearch(String searchString){
        System.debug(searchString);
        String url = 'https://api.scryfall.com/cards/search?unique=prints&q=';
        url += EncodingUtil.urlEncode(searchString, 'UTF-8');

        // Instantiate a new http object
        Http h = new Http();

        // Instantiate a new HTTP request, specify the method (GET) as well as the endpoint
        HttpRequest req = new HttpRequest();
        req.setEndpoint(url);
        req.setMethod('GET');

        // Send the request, and return a response
        HttpResponse res = h.send(req);
        return res.getBody();
    }

    @AuraEnabled
    public static void saveFile(String jsonString){

        ContentDocument doc = [SELECT Id FROM ContentDocument WHERE Title = 'Cards' LIMIT 1];
        delete doc;

        ContentVersion file = new ContentVersion(Title = 'Cards', PathOnClient='Cards.txt', VersionData=Blob.valueOf(jsonString));
        insert file;
    }

    @AuraEnabled
    public static string getFile(){
        return [SELECT Id, VersionData FROM ContentVersion WHERE ContentDocument.Title = 'Cards' AND IsLatest = true].VersionData.toString();
    }

    @AuraEnabled
    public static String getBigFile(){
        return EncodingUtil.base64Encode([SELECT Id, VersionData FROM ContentVersion WHERE ContentDocument.Title = 'ScryfallData' AND IsLatest = true].VersionData);
    }

    @AuraEnabled
    public static String getBigFile2(){
        return EncodingUtil.base64Encode([SELECT Id, VersionData FROM ContentVersion WHERE ContentDocument.Title = 'ScryfallData2' AND IsLatest = true].VersionData);
    }

    @AuraEnabled
    public static string doScryfallCollectionSearch(){

        List<Object> m = (List<Object>)JSON.deserializeUntyped(getFile());
        List<Map<String,String>> ids = new List<Map<String,String>>();
        for(Object card : m){
            ids.add(new Map<String,String>{'id' => (String)((Map<String, Object>)card).get('id')});
        }
        String body = JSON.serialize(ids);
        body = '{"identifiers":' + body + '}';


        String url = 'https://api.scryfall.com/cards/collection';

        Http h = new Http();

        HttpRequest req = new HttpRequest();
        req.setEndpoint(url);
        req.setMethod('POST');
        req.setHeader('content-type', 'application/json');
        req.setBody(body);

        HttpResponse res = h.send(req);
        return res.getBody();
    }

    public static void sendTestEmail(String body){
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

        // Strings to hold the email addresses to which you are sending the email.
        String[] toAddresses = new String[] {'kzymaris@gmail.com'};         

        // Assign the addresses for the To and CC lists to the mail object.
        mail.setToAddresses(toAddresses);

        // Specify the address used when the recipients reply to the email. 
        mail.setReplyTo('kzymaris@gmail.com');

        // Specify the name used as the display name.
        mail.setSenderDisplayName('Test Email');

        // Specify the subject line for your email address.
        mail.setSubject('Test Email');

        // Set to True if you want to BCC yourself on the email.
        mail.setBccSender(false);

        // Optionally append the salesforce.com email signature to the email.
        // The email address of the user executing the Apex Code will be used.
        mail.setUseSignature(false);

        // Specify the text content of the email.
        mail.setPlainTextBody(body);

        mail.setHtmlBody(body);

        // Send the email you have created.
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }

    @AuraEnabled
    public static void runBatch() {
        DoNextCallout m = new DoNextCallout();
        ID batchprocessid = Database.executeBatch(m, 75);
    }
}
