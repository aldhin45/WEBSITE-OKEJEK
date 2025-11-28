# Gunakan Node.js versi stabil
FROM node:18

# Buat folder kerja di dalam kontainer
WORKDIR /app

# Copy file package.json dulu (agar install lebih cepat)
COPY package*.json ./

# Install library
RUN npm install

# Copy sisa kodingan
COPY . .

# Buka port 3000
EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]