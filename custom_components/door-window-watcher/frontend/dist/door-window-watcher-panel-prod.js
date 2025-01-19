/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const H = globalThis, I = H.ShadowRoot && (H.ShadyCSS === void 0 || H.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, te = Symbol(), V = /* @__PURE__ */ new WeakMap();
let he = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== te) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (I && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = V.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && V.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ae = (i) => new he(typeof i == "string" ? i : i + "", void 0, te), le = (i, e) => {
  if (I) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), n = H.litNonce;
    n !== void 0 && s.setAttribute("nonce", n), s.textContent = t.cssText, i.appendChild(s);
  }
}, q = I ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return ae(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: de, defineProperty: ce, getOwnPropertyDescriptor: ue, getOwnPropertyNames: pe, getOwnPropertySymbols: fe, getPrototypeOf: $e } = Object, _ = globalThis, J = _.trustedTypes, _e = J ? J.emptyScript : "", D = _.reactiveElementPolyfillSupport, w = (i, e) => i, M = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? _e : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, B = (i, e) => !de(i, e), K = { attribute: !0, type: String, converter: M, reflect: !1, hasChanged: B };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), _.litPropertyMetadata ?? (_.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class y extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = K) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), n = this.getPropertyDescriptor(e, s, t);
      n !== void 0 && ce(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: n, set: o } = ue(this.prototype, e) ?? { get() {
      return this[t];
    }, set(r) {
      this[t] = r;
    } };
    return { get() {
      return n == null ? void 0 : n.call(this);
    }, set(r) {
      const a = n == null ? void 0 : n.call(this);
      o.call(this, r), this.requestUpdate(e, a, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? K;
  }
  static _$Ei() {
    if (this.hasOwnProperty(w("elementProperties"))) return;
    const e = $e(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(w("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(w("properties"))) {
      const t = this.properties, s = [...pe(t), ...fe(t)];
      for (const n of s) this.createProperty(n, t[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, n] of t) this.elementProperties.set(s, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const n = this._$Eu(t, s);
      n !== void 0 && this._$Eh.set(n, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const n of s) t.unshift(q(n));
    } else e !== void 0 && t.push(q(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return le(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostConnected) == null ? void 0 : s.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostDisconnected) == null ? void 0 : s.call(t);
    });
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$EC(e, t) {
    var o;
    const s = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, s);
    if (n !== void 0 && s.reflect === !0) {
      const r = (((o = s.converter) == null ? void 0 : o.toAttribute) !== void 0 ? s.converter : M).toAttribute(t, s.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var o;
    const s = this.constructor, n = s._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = s.getPropertyOptions(n), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : ((o = r.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? r.converter : M;
      this._$Em = n, this[n] = a.fromAttribute(t, r.type), this._$Em = null;
    }
  }
  requestUpdate(e, t, s) {
    if (e !== void 0) {
      if (s ?? (s = this.constructor.getPropertyOptions(e)), !(s.hasChanged ?? B)(this[e], t)) return;
      this.P(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$ET());
  }
  P(e, t, s) {
    this._$AL.has(e) || this._$AL.set(e, t), s.reflect === !0 && this._$Em !== e && (this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Set())).add(e);
  }
  async _$ET() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, r] of this._$Ep) this[o] = r;
        this._$Ep = void 0;
      }
      const n = this.constructor.elementProperties;
      if (n.size > 0) for (const [o, r] of n) r.wrapped !== !0 || this._$AL.has(o) || this[o] === void 0 || this.P(o, this[o], r);
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (s = this._$EO) == null || s.forEach((n) => {
        var o;
        return (o = n.hostUpdate) == null ? void 0 : o.call(n);
      }), this.update(t)) : this._$EU();
    } catch (n) {
      throw e = !1, this._$EU(), n;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((s) => {
      var n;
      return (n = s.hostUpdated) == null ? void 0 : n.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EU() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Ej && (this._$Ej = this._$Ej.forEach((t) => this._$EC(t, this[t]))), this._$EU();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
}
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[w("elementProperties")] = /* @__PURE__ */ new Map(), y[w("finalized")] = /* @__PURE__ */ new Map(), D == null || D({ ReactiveElement: y }), (_.reactiveElementVersions ?? (_.reactiveElementVersions = [])).push("2.0.4");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const P = globalThis, N = P.trustedTypes, Z = N ? N.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, se = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, ne = "?" + $, Ae = `<${ne}>`, g = document, v = () => g.createComment(""), U = (i) => i === null || typeof i != "object" && typeof i != "function", W = Array.isArray, me = (i) => W(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", z = `[ 	
\f\r]`, b = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, F = /-->/g, G = />/g, A = RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Q = /'/g, X = /"/g, ie = /^(?:script|style|textarea|title)$/i, ge = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), ye = ge(1), E = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), Y = /* @__PURE__ */ new WeakMap(), m = g.createTreeWalker(g, 129);
function re(i, e) {
  if (!W(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Z !== void 0 ? Z.createHTML(e) : e;
}
const Ee = (i, e) => {
  const t = i.length - 1, s = [];
  let n, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = b;
  for (let a = 0; a < t; a++) {
    const h = i[a];
    let d, u, l = -1, p = 0;
    for (; p < h.length && (r.lastIndex = p, u = r.exec(h), u !== null); ) p = r.lastIndex, r === b ? u[1] === "!--" ? r = F : u[1] !== void 0 ? r = G : u[2] !== void 0 ? (ie.test(u[2]) && (n = RegExp("</" + u[2], "g")), r = A) : u[3] !== void 0 && (r = A) : r === A ? u[0] === ">" ? (r = n ?? b, l = -1) : u[1] === void 0 ? l = -2 : (l = r.lastIndex - u[2].length, d = u[1], r = u[3] === void 0 ? A : u[3] === '"' ? X : Q) : r === X || r === Q ? r = A : r === F || r === G ? r = b : (r = A, n = void 0);
    const f = r === A && i[a + 1].startsWith("/>") ? " " : "";
    o += r === b ? h + Ae : l >= 0 ? (s.push(d), h.slice(0, l) + se + h.slice(l) + $ + f) : h + $ + (l === -2 ? a : f);
  }
  return [re(i, o + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class x {
  constructor({ strings: e, _$litType$: t }, s) {
    let n;
    this.parts = [];
    let o = 0, r = 0;
    const a = e.length - 1, h = this.parts, [d, u] = Ee(e, t);
    if (this.el = x.createElement(d, s), m.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (n = m.nextNode()) !== null && h.length < a; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const l of n.getAttributeNames()) if (l.endsWith(se)) {
          const p = u[r++], f = n.getAttribute(l).split($), T = /([.?@])?(.*)/.exec(p);
          h.push({ type: 1, index: o, name: T[2], strings: f, ctor: T[1] === "." ? be : T[1] === "?" ? we : T[1] === "@" ? Pe : R }), n.removeAttribute(l);
        } else l.startsWith($) && (h.push({ type: 6, index: o }), n.removeAttribute(l));
        if (ie.test(n.tagName)) {
          const l = n.textContent.split($), p = l.length - 1;
          if (p > 0) {
            n.textContent = N ? N.emptyScript : "";
            for (let f = 0; f < p; f++) n.append(l[f], v()), m.nextNode(), h.push({ type: 2, index: ++o });
            n.append(l[p], v());
          }
        }
      } else if (n.nodeType === 8) if (n.data === ne) h.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = n.data.indexOf($, l + 1)) !== -1; ) h.push({ type: 7, index: o }), l += $.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = g.createElement("template");
    return s.innerHTML = e, s;
  }
}
function S(i, e, t = i, s) {
  var r, a;
  if (e === E) return e;
  let n = s !== void 0 ? (r = t._$Co) == null ? void 0 : r[s] : t._$Cl;
  const o = U(e) ? void 0 : e._$litDirective$;
  return (n == null ? void 0 : n.constructor) !== o && ((a = n == null ? void 0 : n._$AO) == null || a.call(n, !1), o === void 0 ? n = void 0 : (n = new o(i), n._$AT(i, t, s)), s !== void 0 ? (t._$Co ?? (t._$Co = []))[s] = n : t._$Cl = n), n !== void 0 && (e = S(i, n._$AS(i, e.values), n, s)), e;
}
class Se {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, n = ((e == null ? void 0 : e.creationScope) ?? g).importNode(t, !0);
    m.currentNode = n;
    let o = m.nextNode(), r = 0, a = 0, h = s[0];
    for (; h !== void 0; ) {
      if (r === h.index) {
        let d;
        h.type === 2 ? d = new O(o, o.nextSibling, this, e) : h.type === 1 ? d = new h.ctor(o, h.name, h.strings, this, e) : h.type === 6 && (d = new Ce(o, this, e)), this._$AV.push(d), h = s[++a];
      }
      r !== (h == null ? void 0 : h.index) && (o = m.nextNode(), r++);
    }
    return m.currentNode = g, n;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class O {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, s, n) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = n, this._$Cv = (n == null ? void 0 : n.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = S(this, e, t), U(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== E && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : me(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && U(this._$AH) ? this._$AA.nextSibling.data = e : this.T(g.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: t, _$litType$: s } = e, n = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = x.createElement(re(s.h, s.h[0]), this.options)), s);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === n) this._$AH.p(t);
    else {
      const r = new Se(n, this), a = r.u(this.options);
      r.p(t), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = Y.get(e.strings);
    return t === void 0 && Y.set(e.strings, t = new x(e)), t;
  }
  k(e) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, n = 0;
    for (const o of e) n === t.length ? t.push(s = new O(this.O(v()), this.O(v()), this, this.options)) : s = t[n], s._$AI(o), n++;
    n < t.length && (this._$AR(s && s._$AB.nextSibling, n), t.length = n);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, t); e && e !== this._$AB; ) {
      const n = e.nextSibling;
      e.remove(), e = n;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class R {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, n, o) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = t, this._$AM = n, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(e, t = this, s, n) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = S(this, e, t, 0), r = !U(e) || e !== this._$AH && e !== E, r && (this._$AH = e);
    else {
      const a = e;
      let h, d;
      for (e = o[0], h = 0; h < o.length - 1; h++) d = S(this, a[s + h], t, h), d === E && (d = this._$AH[h]), r || (r = !U(d) || d !== this._$AH[h]), d === c ? e = c : e !== c && (e += (d ?? "") + o[h + 1]), this._$AH[h] = d;
    }
    r && !n && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class be extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class we extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Pe extends R {
  constructor(e, t, s, n, o) {
    super(e, t, s, n, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = S(this, e, t, 0) ?? c) === E) return;
    const s = this._$AH, n = e === c && s !== c || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== c && (s === c || n);
    n && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ce {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    S(this, e);
  }
}
const L = P.litHtmlPolyfillSupport;
L == null || L(x, O), (P.litHtmlVersions ?? (P.litHtmlVersions = [])).push("3.2.1");
const ve = (i, e, t) => {
  const s = (t == null ? void 0 : t.renderBefore) ?? e;
  let n = s._$litPart$;
  if (n === void 0) {
    const o = (t == null ? void 0 : t.renderBefore) ?? null;
    s._$litPart$ = n = new O(e.insertBefore(v(), o), o, void 0, t ?? {});
  }
  return n._$AI(i), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let C = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ve(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return E;
  }
};
var ee;
C._$litElement$ = !0, C.finalized = !0, (ee = globalThis.litElementHydrateSupport) == null || ee.call(globalThis, { LitElement: C });
const j = globalThis.litElementPolyfillSupport;
j == null || j({ LitElement: C });
(globalThis.litElementVersions ?? (globalThis.litElementVersions = [])).push("4.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ue = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xe = { attribute: !0, type: String, converter: M, reflect: !1, hasChanged: B }, Oe = (i = xe, e, t) => {
  const { kind: s, metadata: n } = t;
  let o = globalThis.litPropertyMetadata.get(n);
  if (o === void 0 && globalThis.litPropertyMetadata.set(n, o = /* @__PURE__ */ new Map()), o.set(t.name, i), s === "accessor") {
    const { name: r } = t;
    return { set(a) {
      const h = e.get.call(this);
      e.set.call(this, a), this.requestUpdate(r, h, i);
    }, init(a) {
      return a !== void 0 && this.P(r, void 0, i), a;
    } };
  }
  if (s === "setter") {
    const { name: r } = t;
    return function(a) {
      const h = this[r];
      e.call(this, a), this.requestUpdate(r, h, i);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function Te(i) {
  return (e, t) => typeof t == "object" ? Oe(i, e, t) : ((s, n, o) => {
    const r = n.hasOwnProperty(o);
    return n.constructor.createProperty(o, r ? { ...s, wrapped: !0 } : s), r ? Object.getOwnPropertyDescriptor(n, o) : void 0;
  })(i, e, t);
}
var He = Object.defineProperty, Me = Object.getOwnPropertyDescriptor, oe = (i, e, t, s) => {
  for (var n = s > 1 ? void 0 : s ? Me(e, t) : e, o = i.length - 1, r; o >= 0; o--)
    (r = i[o]) && (n = (s ? r(e, t, n) : r(n)) || n);
  return s && n && He(e, t, n), n;
};
let k = class extends C {
  render() {
    return ye`
      <div> 
        <h1>Door Window Watcher Panel</h1>
        <p>Panel to monitor the status of doors and windows</p>
      </div>
    `;
  }
};
oe([
  Te()
], k.prototype, "hass", 2);
k = oe([
  Ue("door-window-watcher-panel")
], k);
export {
  k as DoorWindowWatcherPanel
};
