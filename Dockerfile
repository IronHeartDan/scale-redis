FROM node:14
WORKDIR /user/home/app
COPY app /user/home/app/
RUN npm install 
EXPOSE 3000
CMD npm start