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

const { el, mount } = redom;

import { createItems } from "./data.js";
import {
  ItemCardList,
  HeaderIcon,
  HeaderBar,
  ModalDialog,
  CartList
} from "./view.js";

export async function onDocumentReady(firebaseApp) {
  console.log("Firebase Config", JSON.stringify(firebaseApp.options));

  const db = firebaseApp.firestore();

  console.log(window.location.hostname);

  if (window.location.hostname === "localhost") {
      console.log("localhost detected");
      db.settings({
           host: "localhost:8080",
           ssl: false
      });
    };
  if (window.location.hostname === "127.0.0.1") {
    console.log ("127.0.0.1 Host datetected");
    db.settings({
      host: "0.0.0.0:8080",
      ssl: false
    });
  }
  if (window.location.hostname.substring(window.location.hostname.length - 9) === "gitpod.io") {
      console.log("gitpod host Detected");
//      db.settings({
//           host: "window.location.hostname",
//           ssl: false
//      });
      db.settings({
           host: 'https://8080-ad16650c-01dd-4779-bda4-ddff48e1d16e.ws-eu01.gitpod.io/',
           ssl: false
      });
  };
  

  const auth = firebaseApp.auth();
  const homePage = new HomePage(db, auth);
  mount(document.body, homePage);
}

class HomePage {
  db;
  auth;

  headerBar;
  itemCardList;
  modalDialog;

  cartItems = {};
  cartItemsUnsub;

  constructor(db, auth) {
    this.db = db;
    this.auth = auth;

    this.headerBar = new HeaderBar([
      new HeaderIcon("sign_in", "account_circle", "Sign In", () => {
        this.onSignInClicked();
      }),
      new HeaderIcon("cart", "shopping_cart", "N/A", () => {
        this.showCart();
      })
    ]);

    this.itemCardList = new ItemCardList(async (id, data) => {
      try {
        await this.addToCart(id, data);
      } catch (e) {
        console.warn(e);
        this.showError("Error adding item to cart");
      }
    });

    this.modalDialog = new ModalDialog("Cart", "Nothing here.");

    this.el = el("div.header-page", [
      this.headerBar,
      this.itemCardList,
      this.modalDialog
    ]);

    this.listenForAuth();
    this.listenForItems();
  }

  listenForAuth() {
    this.auth.onAuthStateChanged(user => {
      console.log(`auth.currentUser = ${JSON.stringify(user)}`);
      const signedIn = user !== null;
      this.setSignedIn(signedIn);
    });
  }

  listenForItems() {
    this.db.collection("items").onSnapshot(items => {
      // Note: for the purposes of this demo we create random items in the database if none exist.
      // In a real app it would not make sense for the client to do this.
      if (items.size === 0) {
        createItems(this.db);
        return;
      }

      this.itemCardList.setItems(items);
    });
  }

  async listenForCart(uid) {
    console.log(`listenForCart(${uid})`);

    // If we were previously listening to the cart for
    // a different user, unsubscribe.
    if (this.cartItemsUnsub) {
      this.cartItemsUnsub();
      this.cartItemsUnsub = null;
    }

    // If needed, create the base cart object
    const cartRef = this.db.collection("carts").doc(uid);
    await cartRef.set(
      {
        ownerUID: uid
      },
      { merge: true }
    );

    // Listen for updates to the cart
    // TODO: Unsub from this as well
    this.cartUnsub = cartRef.onSnapshot(cart => {
      console.log("cart", cart.data());

      const total = cart.data().totalPrice || 0;
      const count = cart.data().itemCount || 0;
      this.headerBar.setIconText("cart", `\$${total.toFixed(2)} (${count})`);
    });

    // Listen for updates to cart items
    this.cartItemsUnsub = cartRef.collection("items").onSnapshot(items => {
      this.setCartItems(items);
    });
  }

  onSignInClicked() {
    if (this.auth.currentUser !== null) {
      this.auth.signOut();
    } else {
      this.auth.signInAnonymously();
    }
  }

  setSignedIn(signedIn) {
    if (signedIn) {
      this.headerBar.setIconText("sign_in", "Sign Out");
      this.headerBar.setIconEnabled("cart", true);
      this.listenForCart(this.auth.currentUser.uid);
    } else {
      this.headerBar.setIconText("sign_in", "Sign In");
      this.headerBar.setIconText("cart", "N/A");
      this.headerBar.setIconEnabled("cart", false);
      this.setCartItems(null);
    }
  }

  setCartItems(items) {
    let itemIds;

    if (items) {
      this.cartItems = items.docs.map(doc => doc.data());
      itemIds = items.docs.map(doc => doc.id);
    } else {
      this.cartItems = [];
      itemIds = [];
    }

    // For any item in the cart, we disable the add button
    this.itemCardList.getAll().forEach(itemCard => {
      const inCart = itemIds.indexOf(itemCard.id) >= 0;
      itemCard.setAddEnabled(!inCart);
    });
  }

  addToCart(id, itemData) {
    console.log("addToCart", id, JSON.stringify(itemData));

    // ADD These lines from codelab: Getting started with the Firebase Local Emulator Suite

    if (this.auth.currentUser === null){
        this.showError("You must be signed in!");
        return;
    }

    return this.db
      .collection("carts")
      .doc(this.auth.currentUser.uid)
      .collection("items")
      .doc(id)
      .set(itemData);
  }

  showCart() {
    if (this.auth.currentUser === null) {
      return;
    }

    const items = this.cartItems.map(doc => `${doc.name} - ${doc.price}`);
    this.modalDialog.setContent(new CartList(items));
    this.modalDialog.show();
  }

  showError(e) {
    alert(e);
  }
}
