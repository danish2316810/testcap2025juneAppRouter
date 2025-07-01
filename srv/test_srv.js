const { db } = require('@sap/cds');
const { entity } = require('@sap/cds')
const cds= require('@sap/cds');
const { message } = require('@sap/cds/lib/log/cds-error');



module.exports=srv=>{
        srv.on('POST', 'CUST', async (req, next)=>{
            console.log(req.user)
            console.log(req.user.id)
            console.log(req.user.roles)
            // if (!req.user.is("User")) {
            //     req.reject(403, "You are not authorized");
            //   }
              console.log(req.user)
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