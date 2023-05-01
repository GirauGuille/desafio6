import mongoose from "mongoose";

const URI = 'mongodb+srv://girauguillermo:giraug@cluster0.bfpv0cy.mongodb.net/electrogirau?retryWrites=true&w=majority'

mongoose
    .connect(URI)
    .then(() => console.log ('Conectado a la base de datos MONGDB-ELECTROGIRAU'))
    .catch ((error) => console.log(error))