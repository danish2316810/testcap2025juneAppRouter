const { db } = require('@sap/cds');
const { entity } = require('@sap/cds')
const cds= require('@sap/cds');
const { message } = require('@sap/cds/lib/log/cds-error');



module.exports=srv=>{
        srv.on('POST', 'CUST', async (req, next)=>{
            try{

                const inputData=req.data;
                await cds.tx(req).run(
                    INSERT.into('DB_CUSTOMERS').entries(inputData)
                )
                return{
                    message:"Post Req Successfully",
                    saved:inputData
                }

            }catch(error){
                req.error(500, `Internal Server Error: ${error.message}`); // Shows message in response
            }



        });
  


}