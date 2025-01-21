/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis, V = k.ShadowRoot && (k.ShadyCSS === void 0 || k.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, q = Symbol(), ee = /* @__PURE__ */ new WeakMap();
let ue = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== q) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (V && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ee.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ee.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const me = (s) => new ue(typeof s == "string" ? s : s + "", void 0, q), F = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new ue(t, s, q);
}, _e = (s, e) => {
  if (V) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), r = k.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = t.cssText, s.appendChild(i);
  }
}, te = V ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return me(t);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ye, defineProperty: Ae, getOwnPropertyDescriptor: ve, getOwnPropertyNames: be, getOwnPropertySymbols: Ee, getPrototypeOf: we } = Object, m = globalThis, se = m.trustedTypes, Se = se ? se.emptyScript : "", z = m.reactiveElementPolyfillSupport, C = (s, e) => s, R = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? Se : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, e) {
  let t = s;
  switch (e) {
    case Boolean:
      t = s !== null;
      break;
    case Number:
      t = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(s);
      } catch {
        t = null;
      }
  }
  return t;
} }, K = (s, e) => !ye(s, e), ie = { attribute: !0, type: String, converter: R, reflect: !1, hasChanged: K };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), m.litPropertyMetadata ?? (m.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class b extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ie) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(e, i, t);
      r !== void 0 && Ae(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: r, set: o } = ve(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get() {
      return r == null ? void 0 : r.call(this);
    }, set(n) {
      const h = r == null ? void 0 : r.call(this);
      o.call(this, n), this.requestUpdate(e, h, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ie;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = we(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const t = this.properties, i = [...be(t), ...Ee(t)];
      for (const r of i) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, r] of t) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const r = this._$Eu(t, i);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const r of i) t.unshift(te(r));
    } else e !== void 0 && t.push(te(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return _e(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$EC(e, t) {
    var o;
    const i = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, i);
    if (r !== void 0 && i.reflect === !0) {
      const n = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : R).toAttribute(t, i.type);
      this._$Em = e, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var o;
    const i = this.constructor, r = i._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const n = i.getPropertyOptions(r), h = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((o = n.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? n.converter : R;
      this._$Em = r, this[r] = h.fromAttribute(t, n.type), this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    if (e !== void 0) {
      if (i ?? (i = this.constructor.getPropertyOptions(e)), !(i.hasChanged ?? K)(this[e], t)) return;
      this.P(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$ET());
  }
  P(e, t, i) {
    this._$AL.has(e) || this._$AL.set(e, t), i.reflect === !0 && this._$Em !== e && (this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Set())).add(e);
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
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, n] of r) n.wrapped !== !0 || this._$AL.has(o) || this[o] === void 0 || this.P(o, this[o], n);
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(t)) : this._$EU();
    } catch (r) {
      throw e = !1, this._$EU(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
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
b.elementStyles = [], b.shadowRootOptions = { mode: "open" }, b[C("elementProperties")] = /* @__PURE__ */ new Map(), b[C("finalized")] = /* @__PURE__ */ new Map(), z == null || z({ ReactiveElement: b }), (m.reactiveElementVersions ?? (m.reactiveElementVersions = [])).push("2.0.4");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x = globalThis, L = x.trustedTypes, re = L ? L.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, pe = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, fe = "?" + g, Pe = `<${fe}>`, v = document, O = () => v.createComment(""), T = (s) => s === null || typeof s != "object" && typeof s != "function", Z = Array.isArray, Ce = (s) => Z(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", I = `[ 	
\f\r]`, P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ne = /-->/g, oe = />/g, _ = RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ae = /'/g, he = /"/g, $e = /^(?:script|style|textarea|title)$/i, xe = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), p = xe(1), E = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), le = /* @__PURE__ */ new WeakMap(), y = v.createTreeWalker(v, 129);
function ge(s, e) {
  if (!Z(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return re !== void 0 ? re.createHTML(e) : e;
}
const Oe = (s, e) => {
  const t = s.length - 1, i = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = P;
  for (let h = 0; h < t; h++) {
    const a = s[h];
    let c, u, l = -1, f = 0;
    for (; f < a.length && (n.lastIndex = f, u = n.exec(a), u !== null); ) f = n.lastIndex, n === P ? u[1] === "!--" ? n = ne : u[1] !== void 0 ? n = oe : u[2] !== void 0 ? ($e.test(u[2]) && (r = RegExp("</" + u[2], "g")), n = _) : u[3] !== void 0 && (n = _) : n === _ ? u[0] === ">" ? (n = r ?? P, l = -1) : u[1] === void 0 ? l = -2 : (l = n.lastIndex - u[2].length, c = u[1], n = u[3] === void 0 ? _ : u[3] === '"' ? he : ae) : n === he || n === ae ? n = _ : n === ne || n === oe ? n = P : (n = _, r = void 0);
    const $ = n === _ && s[h + 1].startsWith("/>") ? " " : "";
    o += n === P ? a + Pe : l >= 0 ? (i.push(c), a.slice(0, l) + pe + a.slice(l) + g + $) : a + g + (l === -2 ? h : $);
  }
  return [ge(s, o + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class U {
  constructor({ strings: e, _$litType$: t }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const h = e.length - 1, a = this.parts, [c, u] = Oe(e, t);
    if (this.el = U.createElement(c, i), y.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = y.nextNode()) !== null && a.length < h; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(pe)) {
          const f = u[n++], $ = r.getAttribute(l).split(g), N = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: o, name: N[2], strings: $, ctor: N[1] === "." ? Ue : N[1] === "?" ? He : N[1] === "@" ? Me : W }), r.removeAttribute(l);
        } else l.startsWith(g) && (a.push({ type: 6, index: o }), r.removeAttribute(l));
        if ($e.test(r.tagName)) {
          const l = r.textContent.split(g), f = l.length - 1;
          if (f > 0) {
            r.textContent = L ? L.emptyScript : "";
            for (let $ = 0; $ < f; $++) r.append(l[$], O()), y.nextNode(), a.push({ type: 2, index: ++o });
            r.append(l[f], O());
          }
        }
      } else if (r.nodeType === 8) if (r.data === fe) a.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = r.data.indexOf(g, l + 1)) !== -1; ) a.push({ type: 7, index: o }), l += g.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = v.createElement("template");
    return i.innerHTML = e, i;
  }
}
function w(s, e, t = s, i) {
  var n, h;
  if (e === E) return e;
  let r = i !== void 0 ? (n = t._$Co) == null ? void 0 : n[i] : t._$Cl;
  const o = T(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((h = r == null ? void 0 : r._$AO) == null || h.call(r, !1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = r : t._$Cl = r), r !== void 0 && (e = w(s, r._$AS(s, e.values), r, i)), e;
}
class Te {
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
    const { el: { content: t }, parts: i } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? v).importNode(t, !0);
    y.currentNode = r;
    let o = y.nextNode(), n = 0, h = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new D(o, o.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (c = new De(o, this, e)), this._$AV.push(c), a = i[++h];
      }
      n !== (a == null ? void 0 : a.index) && (o = y.nextNode(), n++);
    }
    return y.currentNode = v, r;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class D {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, r) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
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
    e = w(this, e, t), T(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== E && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ce(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && T(this._$AH) ? this._$AA.nextSibling.data = e : this.T(v.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: t, _$litType$: i } = e, r = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = U.createElement(ge(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(t);
    else {
      const n = new Te(r, this), h = n.u(this.options);
      n.p(t), this.T(h), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = le.get(e.strings);
    return t === void 0 && le.set(e.strings, t = new U(e)), t;
  }
  k(e) {
    Z(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, r = 0;
    for (const o of e) r === t.length ? t.push(i = new D(this.O(O()), this.O(O()), this, this.options)) : i = t[r], i._$AI(o), r++;
    r < t.length && (this._$AR(i && i._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e && e !== this._$AB; ) {
      const r = e.nextSibling;
      e.remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class W {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, r, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = d;
  }
  _$AI(e, t = this, i, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = w(this, e, t, 0), n = !T(e) || e !== this._$AH && e !== E, n && (this._$AH = e);
    else {
      const h = e;
      let a, c;
      for (e = o[0], a = 0; a < o.length - 1; a++) c = w(this, h[i + a], t, a), c === E && (c = this._$AH[a]), n || (n = !T(c) || c !== this._$AH[a]), c === d ? e = d : e !== d && (e += (c ?? "") + o[a + 1]), this._$AH[a] = c;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ue extends W {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class He extends W {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class Me extends W {
  constructor(e, t, i, r, o) {
    super(e, t, i, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = w(this, e, t, 0) ?? d) === E) return;
    const i = this._$AH, r = e === d && i !== d || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== d && (i === d || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class De {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    w(this, e);
  }
}
const B = x.litHtmlPolyfillSupport;
B == null || B(U, D), (x.litHtmlVersions ?? (x.litHtmlVersions = [])).push("3.2.1");
const Ne = (s, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = r = new D(e.insertBefore(O(), o), o, void 0, t ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let A = class extends b {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ne(t, this.renderRoot, this.renderOptions);
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
var ce;
A._$litElement$ = !0, A.finalized = !0, (ce = globalThis.litElementHydrateSupport) == null || ce.call(globalThis, { LitElement: A });
const G = globalThis.litElementPolyfillSupport;
G == null || G({ LitElement: A });
(globalThis.litElementVersions ?? (globalThis.litElementVersions = [])).push("4.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = (s) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(s, e);
  }) : customElements.define(s, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = { attribute: !0, type: String, converter: R, reflect: !1, hasChanged: K }, Re = (s = ke, e, t) => {
  const { kind: i, metadata: r } = t;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), o.set(t.name, s), i === "accessor") {
    const { name: n } = t;
    return { set(h) {
      const a = e.get.call(this);
      e.set.call(this, h), this.requestUpdate(n, a, s);
    }, init(h) {
      return h !== void 0 && this.P(n, void 0, s), h;
    } };
  }
  if (i === "setter") {
    const { name: n } = t;
    return function(h) {
      const a = this[n];
      e.call(this, h), this.requestUpdate(n, a, s);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function S(s) {
  return (e, t) => typeof t == "object" ? Re(s, e, t) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, n ? { ...i, wrapped: !0 } : i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Le(s) {
  return S({ ...s, state: !0, attribute: !1 });
}
const je = async () => {
  if (customElements.get("ha-checkbox") && customElements.get("ha-slider") && !customElements.get("ha-panel-config")) return;
  await customElements.whenDefined("partial-panel-resolver");
  const s = document.createElement("partial-panel-resolver");
  s.hass = {
    panels: [
      {
        url_path: "tmp",
        component_name: "config"
      }
    ]
  }, s._updateRoutes(), await s.routerOptions.routes.tmp.load(), await customElements.whenDefined("ha-panel-config"), await document.createElement("ha-panel-config").routerOptions.routes.automation.load();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const We = (s) => (...e) => ({ _$litDirective$: s, values: e });
let ze = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, i) {
    this._$Ct = e, this._$AM = t, this._$Ci = i;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = {}, Be = (s, e = Ie) => s._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const de = We(class extends ze {
  constructor() {
    super(...arguments), this.key = d;
  }
  render(s, e) {
    return this.key = s, e;
  }
  update(s, [e, t]) {
    return e !== this.key && (Be(s), this.key = e), t;
  }
});
var Ge = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
const Ve = F`
  ha-card {
    display: flex;
    flex-direction: column;
    margin: 5px;
    max-width: calc(100vw - 10px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
  }
  .card-header .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  `;
var qe = Object.defineProperty, Fe = Object.getOwnPropertyDescriptor, Q = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Fe(e, t) : e, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = (i ? n(e, t, r) : n(r)) || r);
  return i && r && qe(e, t, r), r;
};
let H = class extends A {
  render() {
    if (!this.group)
      return p`<div>No group</div>`;
    const s = `new-${this.group.entities.length}`;
    return p`
            <ha-card>
                <div class="card-header">
                    <div class="name"><a @click=${this.renameTitle}>${this.group.title}</a></div>
                    <ha-icon-button .path=${Ge} @click=${() => this.fireGroupChanged(void 0)}></ha-icon-button>                    
                </div>
                <div class="card-content">
                    <h3>Parameters:</h3>
                    <ha-combo-box 
                        .label=${"Watch time based on"} 
                        .value=${this.group.type} 
                        .items=${[{ value: "fixed", label: "Fixed time" }, { value: "temperature", label: "Inside and outside temperature" }]} }
                        .itemLabelPath=${"label"}
                        .itemValuePath=${"value"}
                        @value-changed=${(e) => this.groupParamChanged("type", e.detail.value)}>
                    </ha-combo-box>
                    ${this.group.type == "fixed" ? this.renderParamsFixed(this.group) : this.renderParamsTemperature(this.group)}
                    <h3>Door / Windows:</h3>
                    ${this.group.entities.map((e, t) => p`
                        ${de(t, p`${this.renderEntityPicker(e, t)}`)}
                    `)}
                        ${de(s, this.renderEntityPicker())}
                </div>
            </ha-card>
        `;
  }
  renameTitle() {
    var e;
    const s = prompt("Enter new title", (e = this.group) == null ? void 0 : e.title);
    s != null && this.fireGroupChanged({ ...this.group, title: s });
  }
  renderParamsFixed(s) {
    return p`
            <ha-textfield .label=${"Max duration"} .value=${s.maxDurationSeconds} @change=${(e) => this.groupParamChanged("maxDurationSeconds", e.target.value)}></ha-textfield>
        `;
  }
  renderParamsTemperature(s) {
    return p`
            <ha-entity-picker .hass=${this.hass} required .value=${s.indoorTemperatureEntity} .includeDomains=${["sensor"]} label="Select indoor temperature sensor" @value-changed=${(e) => this.groupParamChanged("indoorTemperaureEntity", e.detail.value)}></ha-entity-picker> 
            <ha-entity-picker .hass=${this.hass} required .value=${s.outdoorTemperatureEntity} .includeDomains=${["sensor"]} label="Select outdoor temperature sensor" @value-changed=${(e) => this.groupParamChanged("outdoorTemperaureEntity", e.detail.value)}></ha-entity-picker> 

            <ha-textfield .label=${"Temperature difference"} .value=${s.temperatureDiff} @change=${(e) => this.groupParamChanged("temperatureDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${"Time difference"} .value=${s.timeDiff} @change=${(e) => this.groupParamChanged("timeDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${"Max temperature"} .value=${s.maxTemperture} @change=${(e) => this.groupParamChanged("maxTemperture", e.target.value)}></ha-textfield>
        `;
  }
  groupParamChanged(s, e) {
    this.group && (console.log("group param changed", s, e), this.fireGroupChanged({ ...this.group, [s]: e }));
  }
  renderEntityPicker(s, e) {
    return p`
        <div class="picker">
            <ha-entity-picker
            .hass=${this.hass}
            .value=${s}
            .entityFilter=${(t) => ["door", "garage_door"].includes(t.attributes.device_class)}
            includeDomains="binary_sensor"
            label="Select door or window"
            @value-changed=${(t) => this.entityPicked(e, t.detail.value)}
            ></ha-entity-picker> 
        </div>
        `;
  }
  fireGroupChanged(s) {
    this.dispatchEvent(new CustomEvent("group-changed", { detail: { group: s } }));
  }
  entityPicked(s, e) {
    if (!this.group)
      return;
    const t = [...this.group.entities];
    s == null && e && t.push(e), s != null && e && (t[s] = e), s != null && !e && t.splice(s, 1), this.fireGroupChanged({ ...this.group, entities: t });
  }
};
H.styles = F`
        ${Ve}

        ha-textfield {
            display: block;
            width: 100%;
        }

    `;
Q([
  S({ attribute: !1 })
], H.prototype, "group", 2);
Q([
  S({ attribute: !1 })
], H.prototype, "hass", 2);
H = Q([
  J("watcher-group-editor")
], H);
var Ke = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, X = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Ze(e, t) : e, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = (i ? n(e, t, r) : n(r)) || r);
  return i && r && Ke(e, t, r), r;
};
let j = class extends A {
  render() {
    return this.groups ? p`
              ${this.groups.map((s, e) => p`
                <watcher-group-editor 
                    .group=${s} 
                    .hass=${this.hass} 
                    @group-changed=${(t) => this.groupChanged(e, t.detail.group)}>
                </watcher-group-editor>`)}
              <ha-button @click=${() => this.addGroup()}>Add group</ha-button>
        ` : p`<div>No groups</div>`;
  }
  addGroup() {
    const s = [...this.groups];
    s.push({ type: "fixed", title: "New group", entities: [], maxDurationSeconds: 60 }), this.fireGroupsChanged(s);
  }
  groupChanged(s, e) {
    const t = [...this.groups];
    e ? t[s] = e : t.splice(s, 1), this.fireGroupsChanged(t);
  }
  fireGroupsChanged(s) {
    this.dispatchEvent(new CustomEvent("groups-changed", { detail: { groups: s } }));
  }
};
X([
  S({ attribute: !1 })
], j.prototype, "groups", 2);
X([
  S({ attribute: !1 })
], j.prototype, "hass", 2);
j = X([
  J("watcher-groups-editor")
], j);
var Je = Object.defineProperty, Qe = Object.getOwnPropertyDescriptor, Y = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Qe(e, t) : e, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = (i ? n(e, t, r) : n(r)) || r);
  return i && r && Je(e, t, r), r;
};
let M = class extends A {
  render() {
    return this.config ? p`
      <ha-card header="Door Window Watcher Panel">
      <div class="card-content">        
        <div>Groups</div>
        <watcher-groups-editor .hass=${this.hass} .groups=${this.config.groups} @groups-changed=${(s) => this.config = { ...this.config, groups: s.detail.groups }}></watcher-groups-editor>
        <div>
        <div class="right">
          <ha-button @click="${this.saveConfig}">Save</ha-button>
        </div>
      </div>        
      </div>
    </ha-card>
    ` : p`<div>No config</div>`;
  }
  connectedCallback() {
    super.connectedCallback(), je(), this.hass.callWS({ type: "dww/get_config" }).then((s) => {
      console.log("Config loaded:", s);
      const e = s ?? { groups: [] };
      e.groups || (e.groups = []), this.config = e;
    }).catch((s) => {
      console.error("Error loading config:", s);
    });
  }
  saveConfig() {
    console.log("Saving config:", this.config), this.hass.callWS({
      type: "dww/save_config",
      config: this.config
    }).then((s) => {
      console.log("Save result:", s);
    }).catch((s) => {
      console.error("Error saving config:", s);
    });
  }
};
M.styles = F`
    .right {
      display: flex;
      justify-content: flex-end;
    }
  `;
Y([
  S({ attribute: !1 })
], M.prototype, "hass", 2);
Y([
  Le()
], M.prototype, "config", 2);
M = Y([
  J("door-window-watcher-panel")
], M);
export {
  M as DoorWindowWatcherPanel
};
