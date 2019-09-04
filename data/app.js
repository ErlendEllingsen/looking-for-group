/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');

const obj = JSON.parse(fs.readFileSync('./realms.json').toString());

const realms = obj.data.Realms;

let i = 0;
for (let realm of realms) {
    console.log("{id: " + i + ", name: '" + realm.name + "'},");
    i++;
}

//console.log(realms.length);