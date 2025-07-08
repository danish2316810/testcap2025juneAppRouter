sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'app/listreportcust/test/integration/FirstJourney',
		'app/listreportcust/test/integration/pages/CustomersList',
		'app/listreportcust/test/integration/pages/CustomersObjectPage'
    ],
    function(JourneyRunner, opaJourney, CustomersList, CustomersObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('app/listreportcust') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCustomersList: CustomersList,
					onTheCustomersObjectPage: CustomersObjectPage
                }
            },
            opaJourney.run
        );
    }
);