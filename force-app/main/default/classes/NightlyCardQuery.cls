public with sharing class NightlyCardQuery implements Schedulable{
    public void execute(SchedulableContext SC) {
        CardSearchController.runBatch();
    }
}
