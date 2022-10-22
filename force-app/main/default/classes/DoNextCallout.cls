public with sharing class DoNextCallout implements Database.Batchable<Object>, Database.AllowsCallouts, Database.Stateful{

    public String fullResponse = '[';
    public Boolean error = false;
    public Integer batchCount = 0;

    public Iterable<Object> start(Database.BatchableContext BC){
        return new CardIterable();
    }

    public void execute(Database.BatchableContext BC, List<Object> scope){
        try{
            List<Map<String,String>> ids = new List<Map<String,String>>();
            for(Object card : scope){
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
            fullResponse += res.getBody().substringAfter('{"object":"list","not_found":[],"data":[').substringBeforeLast(']}') + ',';  

            batchCount++; 
            if(batchCount == 30){
                String jsonString = fullResponse.substringBeforeLast(',') + ']';

                ContentDocument doc = [SELECT Id FROM ContentDocument WHERE Title = 'ScryfallData' LIMIT 1];
                delete doc;

                ContentVersion file = new ContentVersion(Title = 'ScryfallData', PathOnClient='ScryfallData.txt', VersionData=Blob.valueOf(jsonString));
                insert file;
                fullResponse = '[';
            }                        
              
        } catch (Exception e){
            error = true;
            CardSearchController.sendTestEmail(e.getMessage());
        }   
    }

    public void finish(Database.BatchableContext BC){ 
        try{
            if(!error){
                String jsonString = fullResponse.substringBeforeLast(',') + ']';

                ContentDocument doc = [SELECT Id FROM ContentDocument WHERE Title = 'ScryfallData2' LIMIT 1];
                delete doc;

                ContentVersion file = new ContentVersion(Title = 'ScryfallData2', PathOnClient='ScryfallData2.txt', VersionData=Blob.valueOf(jsonString));
                insert file;
            }

        } catch (Exception e){
            CardSearchController.sendTestEmail(e.getMessage());
        }
   


    }
}
