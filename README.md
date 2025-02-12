## Graphql
### Info:   

Steps to get started:  

1. Install dependencies: npm ci  
2. Create .env file (based on .env.example): ./.env  
3. Create db file: ./prisma/database.db  
4. Apply pending migrations: npx prisma migrate deploy  
5. Seed db: npx prisma db seed  
6. Start server: npm run start  

Useful things:  

- Database GUI: npx prisma studio  
- Reset database: npx prisma migrate reset (this command triggers db seeding)  
- To test an existing rest api (swagger): [::1]:8000/docs  
- For ease of test of graphql you can use [api platform](https://learning.postman.com/docs/sending-requests/graphql/graphql-overview/) that can fetch [introspection](https://graphql.org/learn/introspection/)  
