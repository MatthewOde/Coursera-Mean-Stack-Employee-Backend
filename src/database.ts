import * as mongodb from 'mongodb';
import { Employee } from './employee';

export const collections: {
    employees?: mongodb.Collection<Employee>;
} = {}

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    await client.connect()
    
    const db = client.db("meanStackProject");
    await applySchemaValidation(db);

    const employeesConnection = db.collection<Employee>('employees');
    collections.employees = employeesConnection;
}

async function applySchemaValidation(db: mongodb.Db) {
    const jsonShema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "position", "level"],
            additionalProperties: false,
            properties:{
                _id: {},
                name: {
                    bsonType: "string",
                    description: "'name' is a required string",
                },
                position: {
                    bsonType: "string",
                    description: "'position' is a required string",
                    minLength: 5,
                },
                level: {
                    bsonType: "string",
                    description: "'level' is required and is one of 'junior', 'mid', or 'senior'",
                    enum: ["junior", "mid", "senior"],
                },
            },
        },
    };

    await db.command({
        collMod: 'employees',
        validator: jsonShema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === 'NamespaceNotFound'){
            await db.createCollection('employees', {validator: jsonShema})
        }
    })
}
//