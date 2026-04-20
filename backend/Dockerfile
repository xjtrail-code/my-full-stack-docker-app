# syntax=docker/dockerfile:1 



 



# Step 2: Download dependencies 



FROM node:22-alpine AS builder 



WORKDIR /app 



COPY package*.json ./ 



RUN npm install --no-fund --no-audit 



 



# Step 3: Build the NestJS app (TypeScript → JavaScript) 



COPY . . 



RUN npm run build 



 



# Step 4: Run the compiled app 



FROM node:22-alpine 



WORKDIR /app 



COPY --from=builder /app/dist ./dist 



COPY --from=builder /app/node_modules ./node_modules 



COPY --from=builder /app/package*.json ./ 



 



EXPOSE 3000 



CMD ["node", "dist/main"] 
