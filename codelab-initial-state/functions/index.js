// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { Context } = require('mocha');
const { object } = require('firebase-functions/lib/providers/storage');
const db = admin.initializeApp().firestore();

// Recalculates the total cost of a cart; triggered when there's a create
// to any items in a cart.
exports.calculateCart = functions
    .firestore.document("carts/{cartId}/items/{itemId}")
    .onCreate(async (change, context) => {
      let totalPrice = 0;
      let itemCount = 8;
      //log visible in firestore emulator suite "log" tab
//      console.log("calculateCart@onCreate change:");
//      console.log(change);
      console.log("calculateCart@onCreate context:");
      console.log(context);
      console.log("total price", totalPrice);
      let  xObj = {};
      try {

        const cartRef = db.collection("carts").doc(context.params.cartId);
        const itemRef = db.collection("items").doc(context.params.itemId);

        console.log("cart: ");
        

        // eslint-disable-next-line promise/catch-or-return
        cartRef.get()
        .then(doc => {
          if (!doc.exists) {
            console.log('No such cart document!');
            throw new Error('No such cart document!');
          } 
          Object.assign(xObj,doc.data());
          console.log("1. xObj: ", xObj);

          return itemRef.get();
        })
        .then(doc => {
          if (!doc.exists) {
            console.log('No such item document!');
            throw new Error('No such item document!');
          } 
          Object.assign(xObj,doc.data());
          console.log("2. xObj: ", xObj);
          return xObj;
        })
        .then(xDoc => {
          return cartRef.update({
            totalPrice: parseFloat((xDoc.totalPrice || 0),10) + parseFloat(xDoc.price,10),
            itemCount: (xDoc.itemCount || 0) + 1,
          });

        })
        .catch(err => {console.log("Something error happened: ",err)});

      
        //console.log("Item: ")
        //console.log(itemRef.price);
        
        //totalPrice = (cartRef.totalPrice || 0) + (itemRef.price || 0 );

      } catch(err) {
        console.error(err);
      }
    });
