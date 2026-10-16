// ==UserScript==
// @name         Linux DO 楼中楼阅读
// @namespace    local.linuxdo.threaded-reading
// @version      6.1.4
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABj1BMVEVHcEz/ogDv9P/////s///w8PDt/f/w8PD////s///w8PDw8PDw8PD/pAD////////s//8AAAD///8AAAAAAAD////p///r///v9v/v9f/v8/vw8O/v7+/v8/z03qvt/f/v9v/////7+/v/pQD///+zs7P+/v0UFBYLCw35+fn///8AAAD/////////////rgDt/v//qwDt/f/r////pgDs///v8/vv9v//pQD+/v79/f35+fn6+vrw8PAcHB7/sAP////w7+zs7OwdHR/v9v//sATz4br/qgDAwMAHBwn/rgD/sgoVFRft+/8iIiQeHiB0dHX/sgkhISP6+vr/sAXv8/sjIyX/sQX/sAL126H5y2UTExWqqqoXFxn/rQD7+/vw8O/7wkT5y2bv7+/x693/qAD126L/pwDw7urw8vfz4rwfHyEWFhj39/e/v8AJCQvv8/zq6urf398AAALCwsIAAACrq6uLi4wVFRj/sQZISEmzs7N2dnf30n//sQj5y2f03qz8vTQjIyRVVVdWVlc7UZSyAAAAPXRSTlMA9xIFBsDm/AYFn1H5+JABkPfm+fgQBgcBARz7+6b5EP4Hpvn++RL+/PxR+8Cmn/4Q/J9R+ab8wPsSEhwc+9z1RgAAAcJJREFUOMuF0WdXwjAUBuALCiLIHm5xgwqKewarOCl7qSji3uAW3KD+cG8LOI6tfT7knOS9yU1aAJZahkN3r60rHO6y9XbjRKaGH8oAjPbw49ND1uPJPjw9hu1GdrEEt6uSGX+P3nqWSJxZ9T3+TFLFLhe0wLhuY11vCflOXejUF7Lo1zd0nRgU909RAa3H53J+cfk82gA1WTijDDqpd0PI7/zFHzJ8UBPMPfCyuoAh5vzjzRDQMbEMVHfamItDTHunYpoYL2+vz5c5nF/fXuJrofWq4ya9xCF903HVigW7qXaKR3tqF0BBGmZ5NRAFyEkV4VVF5CAhFfwFFUQC/8RsCRABwgWCLQQvKfhMBamf4VWPHwq2jpvneDQfb+G/aNxrOlngdNK014gF5qPD/UVO+4dHZgATaA5E9DwHWnSgwbgGQLqjpKf/oJU7UmDiShB7t5XBldWf6epKULntFWOIyqHOGxe56ch3HqHdori3DiNWNYila5ttfS/Be6b3ffClr21zTSrGoAgLNRfPkbGhfjfqHxqLPF9ooLSfga0cw9Hca54pyL/mosMOKPQvqTXhMDgwOhKNjowODOLEVFtIPgHpQNRAEcfpZgAAAABJRU5ErkJggg==
// @downloadURL  https://github.com/mengxiaoww/linuxdo-threaded-reader/raw/refs/heads/main/linuxdo-comments.user.js
// @updateURL    https://github.com/mengxiaoww/linuxdo-threaded-reader/raw/refs/heads/main/linuxdo-comments.user.js
// @description  长帖按需加载、楼中楼递进连线、未读提示与引用切换，保留论坛原生操作。
// @match        https://linux.do/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  'use strict';

  GM_addStyle(`

    .ldt-native-hidden { display: none !important; }
    [data-ldt-footer="pending"] { display: none !important; }
    [data-ldt-footer="shown"] { animation: ldt-footer-in 180ms ease-out; }
    @keyframes ldt-footer-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { [data-ldt-footer="shown"] { animation: none; } }
    .ldt-reader-window { min-width: 0; overflow-anchor: none; padding: 0 10px; }
    .ldt-independent { min-width: 0; position: relative; overflow-anchor: none; }
    .ldt-reader-toolbar { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--primary-low, #e2e4e7); }
    .ldt-reader-toolbar { flex-wrap: wrap; }
    .ldt-owned .ldt-boost-content { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: 6px; }
    .ldt-owned .ldt-boost-content .discourse-boosts__bubble { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border: 1px solid var(--primary-low, #ddd); border-radius: 6px; background: var(--secondary, #fff); font-size: 12px; line-height: 1.5; max-width: 100%; box-sizing: border-box; }
    .ldt-owned .ldt-boost-content .avatar { width: 18px; height: 18px; flex-shrink: 0; }
    .ldt-owned .ldt-boost-content .discourse-boosts__cooked { min-width: 0; overflow-wrap: anywhere; }
    .ldt-owned .ldt-boost-content p { margin: 0; }

    .ldt-reader-status { color: var(--primary-medium, #777); font-size: 12px; }
    .ldt-reader-more, .ldt-reader-unread { border: 1px solid var(--primary-low, #e2e4e7); border-radius: 5px; background: var(--secondary, #fff); color: var(--tertiary, #3979a3); padding: 7px 10px; font: inherit; font-size: 12px; cursor: pointer; }
    .ldt-reader-more { display: block; margin: 20px auto; }
    .ldt-reader-more:not([data-ldt-retry]) { border: 0; background: transparent; color: var(--primary-medium, #777); cursor: default; pointer-events: none; }
    .ldt-reader-unread { position: fixed; z-index: 100; right: 24px; bottom: 72px; margin: 0; max-width: calc(100% - 28px); border-radius: 18px; padding: 7px 12px; font-size: 12px; box-shadow: 0 2px 10px #0001; }
    .ldt-reader-unread[hidden] { display: none; }
    .ldt-unread { display: inline-flex; flex: 0 0 auto; align-items: center; align-self: center; margin: 0; padding: 1px 5px; border-radius: 4px; background: var(--tertiary-low, #ececfb); color: var(--tertiary, #5965c7); font-size: 10px; line-height: 16px; font-weight: 500; white-space: nowrap; }
    .ldt-owned .ldt-unread { order: 2; }
    .post-stream.ldt-thread .read-state { display: none !important; }


    .ldt-owned { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
    .ldt-owned > .topic-post { width: auto !important; max-width: 100%; min-width: 0; box-sizing: border-box; margin-inline-end: 0; }
    .ldt-owned > .topic-post > .boxed { width: 100%; max-width: 100%; box-sizing: border-box; }
    .ldt-owned > .topic-post > .boxed > .row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 12px; width: 100%; margin: 0; }
    .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) > .boxed > .row { grid-template-columns: 28px minmax(0, 1fr); gap: 10px; }
    .ldt-native-content { display: contents; }
    .ldt-native-post > .ldt-native-content > .topic-post { width: 100%; max-width: 100%; margin: 0 !important; }
    .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 12px; align-items: start; }
    .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row::before, .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row::after { content: none; }
    .ldt-native-post[data-ldt-depth]:not([data-ldt-depth="0"]) > .ldt-native-content > .topic-post > .boxed > .row { grid-template-columns: 28px minmax(0, 1fr); gap: 10px; }
    .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row:has(> .post-notice) { display: block; width: 100%; }
    .ldt-owned .post-notice { width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box; }
    .ldt-owned .post-notice.new-user { margin-top: 12px; }
    .ldt-owned .topic-body { float: none; width: 100% !important; min-width: 0; max-width: 100%; box-sizing: border-box; margin: 0 !important; }
    .ldt-owned .topic-avatar { float: none; min-width: 0; margin: 0 !important; align-self: start; padding: 12px 0 0 !important; }
    .ldt-owned .topic-meta-data { display: flex; align-items: flex-start; width: 100%; min-width: 0; gap: 8px; margin: 0 !important; box-sizing: border-box; }
    .ldt-owned .names { flex: 1; min-width: 0; }
    .ldt-owned .post-date { position: static !important; float: none; flex: 0 0 auto; width: auto; margin: 0 !important; }
    .ldt-owned .cooked { padding-inline-start: 0 !important; }
    .ldt-owned .contents, .ldt-owned .cooked { width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box; overflow-wrap: anywhere; }
    .ldt-owned .cooked img, .ldt-owned .cooked video { max-width: 100%; height: auto; }
    .ldt-owned .cooked pre, .ldt-owned .cooked table { max-width: 100%; overflow-x: auto; }
    .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-meta-data { padding: 0 0 4px !important; }
    .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked { padding-inline-start: 0 !important; }
    .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area { padding-inline-start: 0 !important; }
    .ldt-owned .post-menu-area .btn { background: transparent; border: 0; box-shadow: none; text-decoration: none; color: var(--primary-medium, #777); }
    .ldt-owned .post-menu-area .btn:hover { color: var(--tertiary, #3979a3); }
    .ldt-owned .actions { min-width: 0; max-width: 100%; flex-wrap: wrap; justify-content: flex-end; }
    .ldt-owned .post-menu-area { gap: 8px; flex-wrap: wrap; align-items: center; }
    .ldt-owned .post-date { white-space: nowrap; color: var(--primary-medium, #777); text-decoration: none; font-size: 12px; }
    .ldt-owned .names .first { color: var(--primary, #333); text-decoration: none; font-weight: 600; }
    .ldt-owned .avatar { border-radius: 50%; }
    .ldt-owned .topic-avatar { position: relative !important; inset: auto !important; }
    .ldt-owned .topic-avatar .post-avatar { position: relative !important; inset: auto !important; transform: none !important; margin: 0 !important; }
    .ldt-owned [data-post-number="1"] .topic-avatar { width: 48px; }
    .ldt-owned [data-post-number="1"] .topic-avatar .avatar { width: 48px; height: 48px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-thread > :is(.ld-inline-status, .ld-inline-more) { position: relative; z-index: 2; margin: 8px 0 8px 38px; font-size: 12px; line-height: 1.5; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-thread > .ld-inline-status { padding: 4px 0; background: var(--primary-very-low, #f7f8fa); }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-thread > .ld-inline-more { max-width: calc(100% - 38px); padding: 6px 10px; border-radius: 5px; background: var(--secondary, #fff); overflow-wrap: anywhere; }
    .post-stream.ldt-thread { display: flex; flex-direction: column; overflow-anchor: none; }
    .post-stream.ldt-thread > [data-post-number]:not([data-post-number="1"]):not([data-ldt-depth]) { order: 1000000; }
    .post-stream.ldt-thread > .ldt-modebar { order: 1; }
    .post-stream.ldt-active .embedded-posts,
    .post-stream.ldt-active .show-replies,
    .post-stream.ldt-active .post__collapse-button,
    .post-stream.ldt-active [data-ldt-depth] .reply-to-tab,
    .post-stream.ldt-thread [data-ldt-depth]:not([data-post-number="1"]) .cooked aside.quote { display: none !important; }

    .ldt-active > [data-ldt-depth] .post-menu-area { margin: 6px 0 8px; }
    .ldt-active > [data-ldt-depth] .cooked p:last-of-type { margin-bottom: 0; }
    .ldt-active > [data-ldt-depth] .discourse-boosts__post-menu:not(:has(*)) { padding: 0; }
    .ldt-active > [data-ldt-depth] .names { flex-wrap: wrap; flex-direction: row; align-items: center; gap: 3px 6px; }
    .ldt-active > [data-ldt-depth] .names > .first { order: 0; margin: 0 !important; min-width: 0; overflow-wrap: anywhere; }
    .ldt-active > [data-ldt-depth] .names > .second,
    .ldt-active > [data-ldt-depth] .names > .user-title { order: 2; }
    .ldt-active > [data-ldt-depth] .names > .user-status-message-wrap { order: 1; }
    .ldt-active > .topic-owner[data-ldt-depth] .cooked::after { content: none !important; display: none !important; }
    .ldt-owner-label {
      order: 1; display: inline-flex !important; align-items: center; align-self: center; margin: 0 !important;
      font-size: 10px !important; font-weight: 400; line-height: 14px !important; height: 16px; box-sizing: border-box;
      color: var(--primary-medium, #777); border: 1px solid var(--primary-low, #ddd);
      border-radius: 3px; padding: 0 4px; white-space: nowrap;
    }

    .post-stream.ldt-thread, #ld-drawer-root [data-ldt-sidepeek] { position: relative; }
    .ldt-connectors { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 1; }
    .ldt-connectors path { fill: none; stroke: var(--primary-low, #e2e4e7); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }

    /* 灰底保持整组连续，内部按父子关系递进，深层缩进设上限。 */
    .post-stream.ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]):not(.post-stream--cloaked) {
      --topic-avatar-width: 28px;
      margin-block: 0; margin-inline-start: 32px !important; padding: 0 12px 0 calc(12px + var(--ldt-indent, 0) * 24px);
      min-width: 0; box-sizing: border-box;
      background: var(--primary-very-low, #f7f8fa);
    }
    .post-stream.ldt-thread > [data-ldt-first] { border-radius: 9px 9px 0 0; margin-top: 8px !important; }
    .post-stream.ldt-thread > [data-ldt-last] { border-radius: 0 0 9px 9px; margin-bottom: 20px !important; padding-bottom: 6px; }
    .post-stream.ldt-thread > [data-ldt-first][data-ldt-last] { border-radius: 9px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-avatar {
      width: 28px; padding: 13px 0 0; margin: 0 !important; border: 0 !important; position: static;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-avatar .avatar { width: 28px; height: 28px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .avatar-flair {
      width: 12px; height: 12px; background-size: 12px; right: -2px; bottom: -2px;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .boxed { padding: 0; border: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-body { padding: 12px 0 9px; border: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .contents { padding-top: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-meta-data { padding: 0 0 4px 10px; gap: 8px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .names {
      flex-wrap: wrap; align-items: center; gap: 3px 7px; min-width: 0; font-size: 13px;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .names .second,
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .names .user-title { display: none; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-date { font-size: 12px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked {
      padding: 2px 0 0 10px; font-size: 15px; line-height: 1.65;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked p { margin: 0 0 .6em; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked > :last-child,
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked p:last-of-type { margin-bottom: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area { margin: 6px 0 0; padding: 0 0 0 10px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area .btn {
      min-height: 30px; padding: 5px 6px; font-size: 12px; color: var(--primary-medium, #777);
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area .d-icon { width: 14px; height: 14px; color: inherit; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area {
      display: grid; grid-template-columns: minmax(0, 1fr) auto;
      align-items: center; column-gap: 10px; row-gap: 0;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-controls { grid-column: 2; grid-row: 1; width: auto; margin: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .actions { display: flex; align-items: center; gap: 4px; float: none; margin: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .small-user-list { grid-column: 1 / -1; grid-row: 2; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .extra-buttons { display: inline-flex; align-items: center; margin: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .accepted-text {
      display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px;
      border: 1px solid color-mix(in srgb, var(--success, #38955b) 15%, var(--secondary, #fff));
      border-radius: 5px; box-sizing: border-box; font-size: 11px !important; line-height: 18px;
      color: color-mix(in srgb, var(--success, #38955b) 40%, var(--primary, #333));
      background: color-mix(in srgb, var(--success, #38955b) 8%, var(--secondary, #fff));
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .accepted-label { font-size: 11px !important; line-height: 18px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .accepted-text .d-icon { width: 12px; height: 12px; color: inherit; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__post-menu { grid-column: 1; grid-row: 1; padding: 0; min-width: 0; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__list { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__bubble {
      display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
      padding: 3px 7px; margin: 0; border: 1px solid var(--primary-low, #ddd);
      border-radius: 5px; background: var(--secondary, #fff); box-shadow: none;
      font-size: 12px; line-height: 18px; box-sizing: border-box;
    }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__bubble > a { display: inline-flex; flex: 0 0 auto; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__bubble .avatar { width: 16px; height: 16px; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__cooked { min-width: 0; font-size: inherit; line-height: inherit; overflow-wrap: anywhere; }
    .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .discourse-boosts__cooked p { margin: 0; }
    .ldt-relation, .ldt-sidepeek-relation { order: 3; margin: 0 !important; padding: 0; border: 0; background: none; text-align: start; font: inherit; font-size: 12px; font-weight: 400; color: var(--primary-medium, #777); line-height: 1.5; overflow-wrap: anywhere; cursor: pointer; }
    .ldt-relation:hover, .ldt-sidepeek-relation:hover { color: var(--tertiary, #3979a3); }
    .ldt-relation:focus-visible, .ldt-sidepeek-relation:focus-visible { outline: 2px solid var(--tertiary, #3979a3); outline-offset: 3px; border-radius: 3px; }
    .post-stream:not(.ldt-thread) .ldt-relation { display: none; }
    .ldt-focus { animation: ldt-focus 1.6s ease-out; }
    @keyframes ldt-focus { from { box-shadow: inset 3px 0 var(--tertiary, #3979a3); } to { box-shadow: inset 3px 0 transparent; } }
    .ldt-updates { position: fixed; right: 24px; bottom: 24px; z-index: 990; padding: 9px 15px; min-height: 40px; border: 1px solid var(--primary-low, #ddd); border-radius: 20px; background: var(--secondary, #fff); color: var(--tertiary, #3979a3); font: inherit; font-size: 13px; box-shadow: 0 3px 14px #0001; cursor: pointer; }
    .ldt-updates:focus-visible { outline: 2px solid var(--tertiary, #3979a3); outline-offset: 3px; }
    body.ld-drawer-page-open > .ldt-updates { display: none; }

    /* SidePeek 智能预览沿用它的递归节点和懒加载，只整理回复区。 */
    #ld-drawer-root [data-ldt-sidepeek] .ld-thread-depth-label,
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-header .ld-post-number,
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-reply-to-tab,
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-reply-to-wrap,
    #ld-drawer-root [data-ldt-sidepeek] [data-thread-post-number]:not([data-thread-post-number="1"]) > .ld-post-body aside.quote { display: none; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-post-card > .ld-inline-thread { position: relative; margin: 12px 16px 20px 32px; padding: 6px 12px; border: 0; border-radius: 9px; background: var(--primary-very-low, #f7f8fa); }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-inline-thread { margin: 0; padding: 0 0 0 var(--ldt-step, 24px); border: 0; background: none; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post { position: relative; min-width: 0; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-thread > .ld-inline-post::before { content: none !important; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post[data-ldt-level="3"] > .ld-inline-thread { --ldt-step: 0px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-body.ld-native-body { padding: 6px 0 8px 38px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-body.ld-native-body .cooked { padding: 0; margin: 0; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-body p:last-child { margin-bottom: 0; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-actions { min-height: 32px; gap: 8px; align-items: center; flex-wrap: wrap; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-actions .ld-post-reply-button { width: 30px; height: 30px; min-height: 30px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-header { gap: 10px; padding: 12px 0 0; align-items: flex-start; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-header .ld-post-avatar { width: 28px; height: 28px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-header .ld-post-author-row { gap: 3px 7px; font-size: 13px; }
    #ld-drawer-root [data-ldt-sidepeek] [data-thread-post-number]:not([data-thread-post-number="1"]) > .ld-post-header .ld-post-author-row > strong { min-width: 0; overflow-wrap: anywhere; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-header .ld-post-username { display: none; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-body { padding: 6px 0 8px 38px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-actions { padding: 0 0 12px 38px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post .ld-post-topic-owner-badge { padding: 0 4px; border-radius: 3px; font-size: 10px; line-height: 16px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-parent-preview [data-thread-post-number] > .ld-post-body aside.quote { display: block; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-boosts { margin: 0 0 12px 38px; padding: 0; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-boosts .discourse-boosts__bubble { margin: 0; padding: 3px 7px; border-radius: 5px; font-size: 12px; }
    #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-post-boosts .avatar { width: 16px; height: 16px; }

    /* 融入原有统计行，不增加独立标题或大号切换面板。 */
    .ldt-modebar { display: inline-flex; align-items: center; margin-inline-start: auto; flex: 0 0 auto; }
    .ldt-modes { display: inline-flex; align-items: center; gap: 14px; }
    .ldt-modes .btn {
      position: relative; min-height: 32px; padding: 5px 0; border: 0;
      background: transparent !important; box-shadow: none !important;
      font-size: 12px; line-height: 1.5; color: var(--primary-medium, #777);
    }
    .ldt-modes .btn[aria-pressed="true"] { color: var(--tertiary, #3979a3); font-weight: 600; }
    .ldt-modes .btn[aria-pressed="true"]::after {
      content: ""; position: absolute; bottom: 2px; left: 0; right: 0;
      height: 2px; border-radius: 2px; background: currentColor;
    }
    .ldt-modes .btn:hover { color: var(--primary, #333); }
    .ldt-modes .btn:focus-visible { outline: 2px solid var(--tertiary, #3979a3); outline-offset: 4px; border-radius: 2px; }
    .topic-map__stats:has(> .ldt-modebar) .topic-map__users-list { min-width: 0; overflow: hidden; }
    .post-stream > .ldt-modebar { justify-content: flex-end; margin: 0; padding: 4px 0; }
    [data-ldt-native-progress] { display: none !important; }
    .ldt-native-timeline .timeline-controls, .ldt-native-timeline .timeline-footer-controls { display: none !important; }
    .ldt-progress-total { display: flex; gap: 2px 6px; margin: 8px 0; font-size: 11px; line-height: 1.5; color: var(--primary-medium, #777); font-variant-numeric: tabular-nums; cursor: default; user-select: none; }
    .ldt-progress-total > span { white-space: nowrap; }
    #topic-progress[data-ldt-mobile-progress] { display: flex; align-items: center; justify-content: center; box-sizing: border-box; height: auto; min-height: 40px; padding: 4px 10px; border: 1px solid var(--primary-low, #ddd); border-radius: 6px; background: var(--secondary, #fff); }
    #topic-progress[data-ldt-mobile-progress] > .nums,
    #topic-progress[data-ldt-mobile-progress] > .bg { display: none !important; }
    .ldt-progress-mobile { display: block; color: var(--primary, #333); font-size: 12px; font-weight: 600; line-height: 1.5; white-space: nowrap; }
    .ldt-auto-quote blockquote { white-space: pre-wrap; overflow-wrap: anywhere; }
    @media (max-width: 640px) {
      .ldt-reader-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 12px; }
      .ldt-reader-status { grid-column: 1; grid-row: 1; }
      .ldt-reader-toolbar .ldt-modebar { grid-column: 2; grid-row: 1 / span 2; align-self: center; }
      .ldt-reader-window { padding-inline: 6px; }
      .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row { grid-template-columns: 36px minmax(0, 1fr); gap: 10px; }
      .ldt-native-post > .ldt-native-content > .topic-post > .boxed > .row > .topic-avatar .avatar { width: 36px; height: 36px; }
      .ldt-native-post[data-ldt-depth]:not([data-ldt-depth="0"]) > .ldt-native-content > .topic-post > .boxed > .row { grid-template-columns: 28px minmax(0, 1fr); }
      .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-meta-data { margin-inline-start: 0; }
      .ldt-owned > [data-ldt-root] .post-menu-area { margin-inline-start: 0; }
      .ldt-owned > .topic-post > .boxed > .row { grid-template-columns: 40px minmax(0, 1fr); gap: 10px; }
      .ldt-owned > .topic-post > .boxed > .row > .topic-avatar .avatar { width: 40px; height: 40px; }
      .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) > .boxed > .row { grid-template-columns: 28px minmax(0, 1fr); }
      .ldt-owned > [data-ldt-depth]:not([data-ldt-depth="0"]) > .boxed > .row > .topic-avatar .avatar { width: 28px; height: 28px; }

      .ldt-updates { right: auto; left: 50%; transform: translateX(-50%); bottom: calc(62px + env(safe-area-inset-bottom, 0px)); white-space: nowrap; }
      #ld-drawer-root [data-ldt-sidepeek] .ld-post-card > .ld-inline-thread { margin-inline: 24px 10px; padding-inline: 10px; }
      #ld-drawer-root [data-ldt-sidepeek] .ldt-sidepeek-relation { flex-basis: 100%; }
      #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post > .ld-inline-thread { --ldt-step: 12px; }
      #ld-drawer-root [data-ldt-sidepeek] .ld-inline-post[data-ldt-level="3"] > .ld-inline-thread { --ldt-step: 0px; }
      .ldt-thread > [data-ldt-root] .cooked { padding-inline-start: 58px; }
      .ldt-thread > [data-ldt-root] .post-menu-area { margin-inline-start: 58px; }
      .post-stream.ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]):not(.post-stream--cloaked) { margin-inline-start: 28px !important; padding-inline: calc(10px + var(--ldt-indent, 0) * 12px) 10px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .topic-meta-data { padding-inline-start: 0; margin-inline-start: 38px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .cooked { padding-inline-start: 38px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area { padding-inline-start: 38px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area .btn { min-height: 40px; min-width: 36px; font-size: 13px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .ldt-relation { flex-basis: 100%; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area:has(.discourse-boosts__bubble) { grid-template-columns: minmax(0, 1fr); row-gap: 5px; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area:has(.discourse-boosts__bubble) .post-controls { grid-column: 1; grid-row: 2; justify-self: end; max-width: 100%; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .post-menu-area:has(.discourse-boosts__bubble) .small-user-list { grid-row: 3; }
      .ldt-thread > [data-ldt-depth]:not([data-ldt-depth="0"]) .actions { flex-wrap: wrap; justify-content: flex-end; }
      .ldt-modes { gap: 16px; }
      .ldt-modes .btn { min-height: 40px; min-width: 44px; justify-content: center; }
    }
  `);

  let mode = typeof GM_getValue === 'function' ? GM_getValue('reading-mode', 'thread') : 'thread';
  if (!['thread', 'quote'].includes(mode)) mode = 'thread';
  let enabled = true;
  let state;
  let modeAnchor;
  let timer;
  let progressFrame;
  const observer = new MutationObserver(records => {
    if (records.some(r => !r.target.closest?.('.ldt-connectors, .ldt-independent') && (r.type !== 'childList' || [...r.addedNodes, ...r.removedNodes].some(n => !n.classList?.contains('ldt-connectors'))))) schedule();
  });
  const connectorTargets = new Set();
  const connectorResize = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleProgress) : null;
  function watchConnectors(node) {
    if (!connectorResize || connectorTargets.has(node)) return;
    connectorTargets.add(node);
    connectorResize.observe(node);
    for (const target of connectorTargets) if (!target.isConnected) { connectorResize.unobserve(target); connectorTargets.delete(target); }
  }
  const observe = () => { const root = document.body || document.documentElement; if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-reply-display'] }); };

  function topicId() {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts[0] === 't' ? Number(/^\d+$/.test(parts[1] || '') ? parts[1] : parts[2]) || 0 : 0;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function merge(s, posts) {
    for (const p of posts || []) {
      const number = Number(p?.post_number), parent = Number(p?.reply_to_post_number);
      if (Number.isSafeInteger(number) && number > 0) s.posts.set(number, {
        number, parent: Number.isSafeInteger(parent) && parent > 0 && parent < number ? parent : 0,
        author: p.display_username || p.name || p.username || '', cooked: p.cooked || '',
        parentAuthor: p.reply_to_user?.name || p.reply_to_user?.username || '',
      });
    }
  }

  // 直接复用论坛已加载的数据，评论 DOM 和原生事件保持不变。
  function snapshot(s) {
    try {
      const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
      const model = page.Discourse?.lookup('controller:topic')?.model;
      if (Number(model?.id) !== s.id) return false;
      s.total = Number(model.postStream?.filteredPostsCount || model.posts_count) || 0;
      s.highest = Number(model.highest_post_number) || s.highest || 0;
      merge(s, model.postStream?.posts);
      return s.posts.size > 0;
    } catch { return false; }
  }

  async function load(s, parent = 0) {
    if (s.requested.has(parent)) return;
    s.requested.add(parent);
    s.queue = s.queue.then(async () => {
      const delay = Math.max(0, s.nextRequest - Date.now());
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (s !== state || s.abort.signal.aborted) return;
      s.nextRequest = Date.now() + 1000;
      try {
        const response = await fetch(parent ? `/t/${s.id}/${parent}.json` : `/t/${s.id}.json`, {
          credentials: 'same-origin', signal: s.abort.signal,
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (s !== state) return;
        s.topicData = data;
        s.total = Number(data.posts_count) || s.total;
        s.highest = Number(data.highest_post_number) || s.highest || 0;
        merge(s, data.post_stream?.posts);
        schedule();
      } catch { /* 权限或网络失败时仍保留原生评论。 */ }
    });
  }

  function layout(s, wrappers) {
    const posts = new Map(s.posts);
    for (const node of wrappers) {
      const n = Number(node.dataset.postNumber);
      if (!posts.has(n)) posts.set(n, { number: n, parent: 0 });
    }
    const ancestry = new Map();
    for (const p of [...posts.values()].sort((a, b) => a.number - b.number)) {
      if (p.number === 1) continue;
      const parent = p.parent > 1 && p.parent < p.number ? ancestry.get(p.parent) : null;
      const position = { depth: parent ? parent.depth + 1 : 0, root: parent?.root || p.number };
      ancestry.set(p.number, position);
    }
    const children = new Map();
    for (const [number, position] of ancestry) {
      const parent = position.depth ? posts.get(number).parent : 0;
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(number);
    }
    const result = new Map();
    const pending = [...(children.get(0) || [])].reverse();
    let rank = 2;
    while (pending.length) {
      const number = pending.pop();
      result.set(number, { rank: rank++ * 10, ...ancestry.get(number) });
      const replies = children.get(number) || [];
      for (let i = replies.length - 1; i >= 0; i--) pending.push(replies[i]);
    }
    return result;
  }

  function headerBottom() {
    return Math.max(0, document.querySelector('.d-header')?.getBoundingClientRect().bottom || 0);
  }

  function readingAnchor(s) {
    return [...s.stream.querySelectorAll(':scope > [data-post-number]:not(.post-stream--cloaked)')]
      .filter(node => !s.stream.classList.contains('ldt-active') || node.hasAttribute('data-ldt-depth') || node.dataset.postNumber === '1')
      .map(node => ({ node, rect: node.getBoundingClientRect() }))
      .filter(({ rect }) => rect.height && rect.bottom > headerBottom() && rect.top < window.innerHeight)
      .sort((a, b) => a.rect.top - b.rect.top)[0]?.node;
  }

  function renderedPost(s, number) {
    const node = s.stream.querySelector(`:scope > [data-post-number="${number}"]`);
    return node && !node.classList.contains('post-stream--cloaked') && node.querySelector(':scope > article') ? node : null;
  }

  function jumpToPost(s, number) {
    if (s.reader) { readerJump(s, number); return; }
    const node = renderedPost(s, number);
    if (!node) { location.assign(`/t/topic/${s.id}/${number}`); return; }
    window.scrollTo({ top: Math.max(0, node.getBoundingClientRect().top + window.scrollY - headerBottom() - 12), behavior: 'auto' });
    node.classList.remove('ldt-focus');
    requestAnimationFrame(() => node.classList.add('ldt-focus'));
    setTimeout(() => node.classList.remove('ldt-focus'), 1600);
    scheduleProgress();
  }

  function syncUpdates(s) {
    if (!s.posts.size) return;
    const highest = Math.max(s.highest || s.total || 0, ...s.posts.keys());
    if (!s.updates) {
      const stored = typeof GM_getValue === 'function' ? GM_getValue(`topic-updates:${s.id}`, null) : null;
      s.updates = new Set(Array.isArray(stored?.pending) ? stored.pending.filter(Number.isSafeInteger) : []);
      s.lastKnown = Number(stored?.highest) || highest;
      s.since = Number(stored?.since) || s.lastKnown;
      s.seenNew = new Set(Array.isArray(stored?.seen) ? stored.seen.filter(Number.isSafeInteger) : []);
    }
    if (highest > s.lastKnown) s.updates.add(highest);
    for (const number of s.posts.keys()) if (number > s.since && !s.seenNew.has(number)) s.updates.add(number);
    s.lastKnown = Math.max(s.lastKnown, highest);
  }

  function updateUnread(s) {
    if (!s.updates) return;
    const rendered = new Map([...s.stream.children].map(node => [Number(node.dataset.postNumber), node]));
    if (!document.hidden) for (const number of s.updates) {
      const node = rendered.get(number);
      if (node?.classList.contains('post-stream--cloaked')) continue;
      const rect = node?.getBoundingClientRect();
      if (rect?.height && rect.bottom > headerBottom() && rect.top < window.innerHeight) {
        s.updates.delete(number);
        s.seenNew.add(number);
      }
    }
    while (s.seenNew.has(s.since + 1)) s.seenNew.delete(++s.since);
    const saved = JSON.stringify({ highest: s.lastKnown, since: s.since, pending: [...s.updates], seen: [...s.seenNew] });
    if (s.savedUpdates !== saved) {
      s.savedUpdates = saved;
      if (typeof GM_setValue === 'function') GM_setValue(`topic-updates:${s.id}`, JSON.parse(saved));
    }
    if (mode !== 'thread' || !s.updates.size) { s.notice?.remove(); s.notice = null; return; }
    if (!s.notice) {
      s.notice = element('button', 'ldt-updates');
      s.notice.type = 'button';
      s.notice.setAttribute('aria-live', 'polite');
      s.notice.addEventListener('click', () => jumpToPost(s, Math.min(...s.updates)));
      document.body.append(s.notice);
    }
    const unresolved = [...s.updates].some(number => !rendered.has(number));
    const text = unresolved ? '有新回复 · 查看' : `${s.updates.size} 条新回复 · 查看`;
    if (s.notice.textContent !== text) s.notice.textContent = text;
  }

  function updateSidepeek() {
    const views = document.querySelectorAll('#ld-drawer-root .ld-topic-view');
    for (const view of views) {
      const active = enabled && view.dataset.replyDisplay === 'inline';
      view.toggleAttribute('data-ldt-sidepeek', active);
      if (active) watchConnectors(view);
      if (!active) {
        view.querySelectorAll('.ldt-sidepeek-relation, .ldt-connectors').forEach(n => n.remove());
        view.querySelectorAll('[data-ldt-more-label]').forEach(n => { n.textContent = n.dataset.ldtMoreLabel; delete n.dataset.ldtMoreLabel; });
        view.querySelectorAll('[data-ldt-level]').forEach(n => n.removeAttribute('data-ldt-level'));
        view.querySelectorAll('.ldt-focus').forEach(n => n.classList.remove('ldt-focus'));
        view.querySelectorAll('[data-ldt-owner-text]').forEach(n => { n.textContent = n.dataset.ldtOwnerText; delete n.dataset.ldtOwnerText; });
        continue;
      }
      for (const button of view.querySelectorAll('.ld-inline-thread > .ld-inline-more')) {
        if (button.disabled) continue;
        const parent = button.parentElement.closest('.ld-post-card, .ld-inline-post');
        const author = parent?.querySelector(':scope > .ld-post-header .ld-post-author-row > strong')?.textContent?.trim();
        if (!button.hasAttribute('data-ldt-more-label')) button.dataset.ldtMoreLabel = button.textContent;
        const label = author ? `更多回复 · ${author}` : '更多回复';
        if (button.textContent !== label) button.textContent = label;
      }
      for (const badge of view.querySelectorAll('.ld-inline-post > .ld-post-header .ld-post-topic-owner-badge')) {
        if (!badge.hasAttribute('data-ldt-owner-text')) badge.dataset.ldtOwnerText = badge.textContent;
        if (badge.textContent !== 'OP') badge.textContent = 'OP';
      }
      for (const card of view.querySelectorAll('.ld-inline-post:not(.ld-parent-preview *)')) {
        const parent = card.parentElement.closest('.ld-post-card, .ld-inline-post');
        card.dataset.ldtLevel = Math.min(3, Number(parent?.dataset.ldtLevel || 0) + 1);
        const row = card.querySelector(':scope > .ld-post-header .ld-post-author-row');
        const author = parent?.querySelector(':scope > .ld-post-header .ld-post-author-row > strong')?.textContent?.trim();
        if (!row || !author) continue;
        let relation = row.querySelector('.ldt-sidepeek-relation');
        if (!relation) {
          relation = element('button', 'ldt-sidepeek-relation');
          relation.type = 'button';
          relation.addEventListener('click', () => {
            const scroller = view.closest('.ld-drawer-body');
            if (scroller) scroller.scrollTo({ top: scroller.scrollTop + parent.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12, behavior: 'auto' });
            parent.classList.add('ldt-focus');
            setTimeout(() => parent.classList.remove('ldt-focus'), 1600);
          });
          row.append(relation);
        }
        const label = `回复 ${author}`;
        if (relation.textContent !== label) relation.textContent = label;
        relation.title = '定位被回复的评论';
      }
    }
  }

  function connectReplies(container, pairs, avatarSelector) {
    const old = container.querySelector(':scope > .ldt-connectors');
    const origin = container.getBoundingClientRect();
    const paths = [];
    for (const [parent, child, number] of pairs) {
      if (!parent || parent.classList.contains('post-stream--cloaked') || child.classList.contains('post-stream--cloaked')) continue;
      const p = parent.querySelector(avatarSelector)?.getBoundingClientRect();
      const c = child.querySelector(avatarSelector)?.getBoundingClientRect();
      if (!p?.width || !c?.width || c.top <= p.top) continue;
      const x = c.left - origin.left - 4, y = c.top - origin.top + c.height / 2;
      const nested = c.left > p.left + 3;
      const lane = nested ? Math.min(p.left - origin.left + p.width / 2, x - 8) : x - 8;
      const startY = nested ? p.bottom - origin.top + 5 : p.top - origin.top + p.height / 2;
      const start = nested ? `M ${p.left - origin.left + p.width / 2} ${startY} H ${lane}` : `M ${p.left - origin.left - 4} ${startY} H ${lane}`;
      paths.push(`<path data-ldt-child="${number}" d="${start} V ${y - 8} Q ${lane} ${y} ${lane + 8} ${y} H ${x}"/>`);
    }
    const html = paths.join('');
    if (!html) { old?.remove(); return; }
    const svg = old || document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (!old) { svg.classList.add('ldt-connectors'); svg.setAttribute('aria-hidden', 'true'); container.append(svg); }
    if (svg.innerHTML !== html) svg.innerHTML = html;
  }

  function updateConnectors() {
    if (state) {
      const { stream, posts } = state;
      const nodes = new Map([...stream.querySelectorAll(':scope > [data-post-number]')].map(n => [Number(n.dataset.postNumber), n]));
      if (mode === 'thread') connectReplies(stream, [...nodes].filter(([n]) => posts.get(n)?.parent > 1).map(([n, child]) => [nodes.get(posts.get(n).parent), child, n]), state.reader ? ':scope > .ldt-native-content > .topic-post > .boxed > .row > .topic-avatar .avatar' : ':scope > .boxed > .row > .topic-avatar .avatar');
      else stream.querySelector(':scope > .ldt-connectors')?.remove();
    }
    for (const view of document.querySelectorAll('#ld-drawer-root [data-ldt-sidepeek]')) {
      connectReplies(view, [...view.querySelectorAll('.ld-inline-post:not(.ld-parent-preview *)')].map(child => [child.parentElement.closest('.ld-post-card, .ld-inline-post'), child, child.dataset.threadPostNumber]), ':scope > .ld-post-header .ld-post-avatar');
    }
  }

  function quoteText(cooked) {
    const body = document.createElement('div');
    body.innerHTML = cooked;
    body.querySelectorAll('aside.quote, script, style, iframe').forEach(n => n.remove());
    body.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
    body.querySelectorAll('p, li, pre, h1, h2, h3, h4, h5, h6').forEach(n => n.append('\n'));
    body.querySelectorAll('img').forEach(n => n.replaceWith(n.alt || '[图片]'));
    return body.textContent.trim().replace(/\n{3,}/g, '\n\n');
  }

  function updateQuote(s, wrapper, post) {
    const cooked = [...wrapper.querySelectorAll('.topic-body > .contents > .cooked, .topic-body > .cooked')]
      .find(n => !n.closest('.embedded-posts'));
    if (!cooked) return;
    const owned = cooked.querySelector(':scope > .ldt-auto-quote');
    const authored = [...cooked.querySelectorAll('aside.quote:not(.ldt-auto-quote)')].some(q =>
      Number(q.dataset.post) === post?.parent && (!q.dataset.topic || Number(q.dataset.topic) === s.id));
    if (mode !== 'quote' || !post?.parent || authored) { owned?.remove(); return; }
    const parent = s.posts.get(post.parent);
    if (!parent?.cooked) { owned?.remove(); load(s, post.parent); return; }
    const text = quoteText(parent.cooked);
    if (!text) { owned?.remove(); return; }
    const signature = JSON.stringify([post.parent, parent.author, text]);
    if (owned?.dataset.signature === signature) return;
    owned?.remove();
    const quote = element('aside', 'quote ldt-auto-quote');
    quote.dataset.signature = signature;
    quote.dataset.post = post.parent;
    quote.dataset.topic = s.id;
    quote.append(element('div', 'title', `${parent.author || '被回复的评论'}：`),
      element('blockquote', '', text));
    cooked.prepend(quote);
  }

  function modebar(s) {
    const bar = element('div', 'ldt-modebar');
    const group = element('div', 'ldt-modes');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', '评论阅读方式');
    for (const [value, label] of [['thread', '楼中楼'], ['quote', '引用']]) {
      const button = element('button', 'btn btn-flat', label);
      button.type = 'button';
      button.dataset.mode = value;
      button.title = value === 'thread' ? '按讨论关系阅读' : '按楼层顺序和引用阅读';
      button.addEventListener('click', () => {
        const anchor = readingAnchor(s);
        const top = anchor?.getBoundingClientRect().top;
        if (value === mode) return;
        modeAnchor = anchor ? { id: s.id, number: Number(anchor.dataset.postNumber), top } : null;
        const wasReader = s.reader;
        mode = value;
        if (typeof GM_setValue === 'function') GM_setValue('reading-mode', mode);
        refresh();
        if (anchor?.isConnected && top !== undefined) {
          window.scrollBy(0, anchor.getBoundingClientRect().top - top); modeAnchor = null;
        } else if (wasReader && value === 'quote' && modeAnchor) {
          const original = renderedPost(state, modeAnchor.number);
          if (original) { window.scrollBy(0, original.getBoundingClientRect().top - modeAnchor.top); modeAnchor = null; }
          else {
            const path = `/t/topic/${s.id}/${modeAnchor.number}`;
            try { (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).require('discourse/lib/url').default.routeTo(path, { skipIfOnScreen: false }); }
            catch { location.assign(path); }
          }
        }
      });
      group.append(button);
    }
    bar.append(group);
    return bar;
  }

  function clearProgress(s) {
    if (s.timelineView) { try { (s.renderer || nativeRenderer()).run(() => s.timelineView.destroy()); } catch {} }
    s.timelineView = s.timelineComponent = null;
    s.progress?.remove();
    s.progress = null;
    s.mobileProgress?.remove();
    s.mobileProgress = null;
    document.querySelectorAll('[data-ldt-native-progress], [data-ldt-mobile-progress]').forEach(n => { delete n.dataset.ldtNativeProgress; delete n.dataset.ldtMobileProgress; });
  }

  function threadSections(s, rect) {
    if (s.reader && !s.rootIds || !s.reader && (!s.total || s.posts.size < s.total)) return null;
    const roots = s.reader ? s.rootIds : new Map([...s.posts.values()].filter(p => p.number > 1 && !p.parent).sort((a, b) => a.number - b.number).map((p, i) => [p.number, i]));
    const posts = s.reader ? s.raw.values() : s.posts.values();
    const sections = [];
    for (const p of posts) {
      const index = roots.get(s.reader ? p.id : p.number);
      if (index === undefined) continue;
      const node = s.reader ? s.nodes.get(p.post_number) : s.stream.querySelector(`:scope > [data-post-number="${p.number}"]:not(.post-stream--cloaked)`);
      const box = node?.getBoundingClientRect();
      if (box?.height) sections.push({ index, start: Math.max(0, box.top - rect.top) });
    }
    sections.sort((a, b) => a.index - b.index);
    for (let i = 0; i < sections.length; i++) sections[i].end = sections[i + 1]?.start ?? rect.height;
    return { total: roots.size, sections };
  }

  function threadProgress(s, rect, position) {
    const groups = threadSections(s, rect);
    if (!groups) return null;
    if (!groups.total) return position;
    // 每串讨论占一个进度单位，楼内回复只延长这一串的阅读区间。
    const point = rect.height * position;
    const group = groups.sections.findLast(p => p.start <= point + 1);
    if (!group) return s.allowStart ? 0 : (groups.sections[0]?.index || 0) / groups.total;
    const fraction = Math.max(0, Math.min(1, (point - group.start) / Math.max(1, group.end - group.start)));
    return Math.max(0, Math.min(1, (group.index + fraction) / groups.total));
  }

  function progressCount(node, label, atEnd = false) {
    if (node.title === label && node.hasAttribute('data-ldt-end-count') === atEnd) return;
    node.title = label;
    node.toggleAttribute('data-ldt-end-count', atEnd);
    const numbers = label.match(/^已加载 (\d+) \/ 共 (\d+) 条顶层回复$/);
    const text = numbers ? ['已加载', `${numbers[1]} 条`] : [];
    node.replaceChildren(...text.filter(Boolean).map(value => element('span', '', value)));
    node.setAttribute('aria-label', atEnd ? `已到末尾，${label}` : label);
  }

  function progressTotal(s) {
    return s.reader ? s.rootIds?.size : s.total && s.posts.size >= s.total ? [...s.posts.values()].filter(p => p.number > 1 && !p.parent).length : undefined;
  }

  function renderProgress(s, progress, atEnd = false) {
    const total = progressTotal(s);
    const index = progress === null || total === undefined ? null : total ? Math.min(total, Math.floor(progress * total + 1e-7) + 1) : 0;
    const text = index === null ? '统计中' : `${index} / ${total}`;
    const candidates = [...document.querySelectorAll('.timeline-fullscreen .timeline-scrollarea-wrapper, .timeline-container .timeline-scrollarea-wrapper')].filter(node => !node.closest('.ldt-native-timeline'));
    const native = candidates.find(node => node.closest('.timeline-fullscreen')) || candidates[0];
    if (!total && s.progress) clearProgress(s);
    if (native && total > 0) {
      if (s.progress && s.progress.previousElementSibling !== native) clearProgress(s);
      if (!s.progress) {
        try {
          s.progress = progressPanel(s, native); native.dataset.ldtNativeProgress = '';
          const title = native.closest('.timeline-fullscreen') && native.parentElement.querySelector(':scope > .title');
          if (title) title.dataset.ldtNativeProgress = '';
        }
        catch (error) { if (!s.timelineError) console.warn('[Linux DO 楼中楼] 原生时间轴未接入', error); s.timelineError = true; }
      }
    }
    const mobile = document.querySelector('#topic-progress');
    if (mobile) {
      if (!s.mobileProgress) s.mobileProgress = element('span', 'ldt-progress-mobile');
      mobile.dataset.ldtMobileProgress = '';
      if (s.mobileProgress.parentElement !== mobile) mobile.append(s.mobileProgress);
      if (s.mobileProgress.textContent !== `回复 ${text}`) s.mobileProgress.textContent = `回复 ${text}`;
    }
    s.timelineReading = { postIndex: index || 1, percent: Math.min(1, (progress || 0) + 1e-7 / Math.max(1, total || 0)) };
    s.timelineComponent?.postScrolled();
    if (s.progress) progressCount(s.progress.querySelector('.ldt-progress-total'), rootCountLabel(s), atEnd);
  }

  async function locateRoot(s, ratio) {
    const total = progressTotal(s);
    if (s !== state || !total) return;
    const index = Math.min(total - 1, Math.floor(Math.max(0, Math.min(1, ratio)) * total));
    const token = s.locating = {};
    s.locateError = false;
    try {
      if (!s.reader) {
        const roots = [...s.posts.values()].filter(p => p.number > 1 && !p.parent).sort((a, b) => a.number - b.number);
        jumpToPost(s, roots[index].number);
      } else {
        const id = [...s.rootIds.keys()][index];
        let post = [...s.raw.values()].find(p => p.id === id);
        const node = post && s.nodes.get(post.post_number);
        const desired = node ? window.scrollY + node.getBoundingClientRect().top - headerBottom() - 12 : Infinity;
        const limit = Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - window.innerHeight);
        const complete = s.cursor >= s.ids.length && !s.rootRemaining?.size;
        if (post && readerCachedPage(s, post) && (desired <= limit + 1 || complete)) {
          s.tailOnly = false;
          if (!index) s.allowStart = true;
          readerJump(s, post.post_number);
        } else {
          // 只查目标顶层回复的楼号，交给原站加载目标附近的一页，不扫描中间历史。
          if (!post) {
            const data = await readerFetch(s, `/t/${s.id}/posts.json?post_ids[]=${id}`);
            post = data.post_stream?.posts?.find(p => p.id === id && Number.isSafeInteger(p.post_number));
          }
          if (s !== state || s.locating !== token) return;
          if (!post || post.topic_id && post.topic_id !== s.id) throw new Error('定位失败');
          location.assign(`/t/topic/${s.id}/${post.post_number}`);
          return;
        }
      }
      if (document.querySelector('.timeline-fullscreen')) {
        try { (s.renderer || nativeRenderer()).owner.lookup('service:app-events')?.trigger?.('topic:jump-to-post'); } catch {}
      }
    } catch {
      if (s === state && s.locating === token) { s.locateError = true; updateProgress(s); }
    } finally {
      if (s.locating === token) { s.locating = null; if (s === state) scheduleProgress(); }
    }
  }

  function readerCachedPage(s, post) {
    if (!s.nodes.has(post.post_number)) return false;
    const index = s.ids.indexOf(post.id);
    if (index >= (s.headCursor || 0) && index < s.cursor) return true;
    const loaded = new Set([...s.raw.values()].map(p => p.id));
    return s.ids.length > 0 && s.ids.every(id => loaded.has(id));
  }

  function jumpToEnd(s, url = `/t/topic/${s.id}/${s.highest || s.total}`) {
    s.locating = null; s.dragRatio = undefined; clearTimeout(s.nextTimer); s.nextTimer = null;
    const number = Number(new URL(url, location.href).pathname.split('/').filter(Boolean).at(-1));
    if (s.reader && s.raw.has(number) && readerCachedPage(s, s.raw.get(number))) {
      s.tailOnly = true; s.allowStart = !s.headCursor; readerEnd(s);
      if (document.querySelector('.timeline-fullscreen')) { try { (s.renderer || nativeRenderer()).owner.lookup('service:app-events')?.trigger?.('topic:jump-to-post'); } catch {} }
    } else if (!s.reader && renderedPost(s, number)) {
      window.scrollTo({ top: Math.max(0, window.scrollY + s.stream.getBoundingClientRect().bottom - window.innerHeight), behavior: 'auto' });
    } else {
      if (s.reader) { try { sessionStorage.setItem('ldt-jump-end', String(s.id)); } catch {} }
      location.assign(url);
    }
  }

  function nativeTimelineModel(s, model) {
    let roots, list;
    const ids = () => {
      if (!s.reader) return model.postStream.posts.filter(p => p.post_number > 1 && !p.reply_to_post_number).sort((a, b) => a.post_number - b.post_number).map(p => p.id);
      if (roots !== s.rootIds) { roots = s.rootIds; list = [...(roots?.keys() || [])]; }
      return list || [];
    };
    const stream = new Proxy(model.postStream, {
      get(target, key) {
        if (key === 'stream') return ids();
        if (key === 'filteredPostsCount') return ids().length;
        if (key === 'isMegaTopic') return false;
        if (key === 'closestDaysAgoFor') return index => target.closestDaysAgoFor(target.stream.indexOf(ids()[index - 1]) + 1);
        if (key === 'excerpt') return index => target.excerpt(target.stream.indexOf(ids()[index]));
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    return new Proxy(model, {
      get(target, key) {
        if (key === 'postStream') return stream;
        if (key === 'get') return path => path === 'postStream' ? stream : path.startsWith('postStream.') ? stream[path.slice(11)] : target.get(path);
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  function progressPanel(s, native) {
    const r = s.renderer || nativeRenderer();
    const load = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).require;
    const Timeline = load('discourse/components/topic-timeline/container').default;
    const { getComponentTemplate, setComponentTemplate } = load('@ember/component');
    const scrolled = Object.getOwnPropertyDescriptor(Timeline.prototype, 'postScrolled');
    // 直接使用原站组件的模板、轨道、拖动与预览；只替换筛选数据及定位出口。
    class FilteredTimeline extends Timeline {
      get showTimelineControls() { return false; }
      get displaySummary() { return false; }
      get canCreatePost() { return false; }
      constructor(...args) { super(...args); s.timelineComponent = this; }
      get postScrolled() {
        const original = scrolled.get ? scrolled.get.call(this) : scrolled.value;
        const handler = () => {
          if (s !== state || mode !== 'thread' || this.isDestroying || this.isDestroyed || this.dragging || s.dragRatio !== undefined || s.locating) return;
          original.call(this, s.timelineReading || { postIndex: 1, percent: 0 });
        };
        Object.defineProperty(this, 'postScrolled', { value: handler, configurable: true });
        return handler;
      }
    }
    setComponentTemplate(getComponentTemplate(Timeline), FilteredTimeline);
    const panel = element('div', 'ldt-native-timeline'); panel.setAttribute('aria-label', '顶层回复进度');
    const target = element('div', ''); panel.append(target, element('div', 'ldt-progress-total'));
    const args = {
      model: nativeTimelineModel(s, r.controller.model), enteredIndex: 0,
      fullscreen: !!native.closest('.timeline-fullscreen'),
      setDocked() {}, setDockedBottom() {},
      jumpTop(event) { return r.controller.send('jumpTop', event); },
      jumpToPostPrompt() { return r.controller.send('jumpToPostPrompt'); },
      jumpToIndex(index) { s.dragRatio = undefined; return locateRoot(s, (index - .5) / progressTotal(s)); },
      jumpEnd() { s.dragRatio = undefined; return jumpToEnd(s, r.controller.model.lastPostUrl || undefined); },
    };
    const properties = { renderGlimmer: { _registrations: [{ element: target, component: r.curry(FilteredTimeline, args, r.owner) }] } };
    r.setOwner(properties, r.owner);
    const view = r.Component.extend({ layout: r.template }).create(properties);
    native.after(panel);
    try { r.run(() => view.appendTo(panel)); } catch (error) { r.run(() => view.destroy()); panel.remove(); throw error; }
    s.timelineView = view;
    // 新一次原生操作开始即作废上一次异步定位，不改写原生指针手势。
    panel.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.target.closest('.timeline-scrollarea')) return;
      clearTimeout(s.nextTimer); s.nextTimer = null; s.locating = null; s.locateError = false; s.dragRatio = 0;
    }, true);
    const released = () => queueMicrotask(() => { s.dragRatio = undefined; scheduleProgress(); });
    panel.addEventListener('pointerup', released, true);
    panel.addEventListener('pointercancel', released, true);
    return panel;
  }

  function updateProgress(s) {
    if (!s.reader) updateUnread(s);
    if (mode !== 'thread') { clearProgress(s); return; }
    if (s.reader) { updateReader(s); return; }
    const rect = s.stream.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (headerBottom() + 12 - rect.top) / Math.max(1, rect.height)));
    const atEnd = rect.bottom <= window.innerHeight;
    const progress = s.dragRatio ?? (atEnd ? 1 : threadProgress(s, rect, position));
    renderProgress(s, progress, atEnd);
  }

  function scheduleProgress() {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => { progressFrame = 0; if (state) updateProgress(state); updateConnectors(); });
  }

  function cleanup() {
    if (!state) return;
    state.stopReplySync?.();
    state.abort.abort();
    if (state.nativeContext) {
      const { stream, added } = state.nativeContext;
      state.renderer.run(() => {
        stream.posts.splice(0, stream.posts.length, ...stream.posts.filter(post => !added.has(post.id)));
        stream.notifyPropertyChange?.('loadedAllPosts');
        stream.notifyPropertyChange?.('firstPostPresent');
      });
    }
    if (state.reader) { state.autoReplies?.disconnect(); clearTimeout(state.autoTimer); clearTimeout(state.readTimer); clearTimeout(state.nextTimer); clearInterval(state.checkTimer); for (const view of state.views.values()) { try { state.renderer.run(() => view.destroy()); } catch {} } state.host.remove(); state.native.classList.remove("ldt-native-hidden"); }
    state.notice?.remove();
    clearProgress(state);
    document.querySelectorAll('[data-ldt-footer]').forEach(node => delete node.dataset.ldtFooter);
    state.stream.querySelector(":scope > .ldt-connectors")?.remove();
    state.bar.remove();
    state.style.remove();
    const stream = state.stream;
    stream.classList.remove('ldt-active', 'ldt-thread');
    stream.querySelectorAll('.ldt-focus').forEach(n => n.classList.remove('ldt-focus'));
    stream.querySelectorAll('.ldt-relation, .ldt-owner-label, .ldt-auto-quote').forEach(n => n.remove());
    for (const n of stream.children) {
      delete n.dataset.ldtDepth;
      delete n.dataset.ldtRank;
      delete n.dataset.ldtFirst;
      delete n.dataset.ldtLast;
      delete n.dataset.ldtRoot;
      delete n.dataset.ldtConnected;
    }
    state = null;
  }

  // 长帖的楼中楼单独管理节点，不改动论坛虚拟列表的顺序和占位高度。
  function nativeTopic() {
    try { return (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).Discourse?.lookup('controller:topic')?.model; } catch { return null; }
  }

  function readerVisible(s, node) {
    const r = node.getBoundingClientRect(), box = s.reader.getBoundingClientRect();
    const composer = document.querySelector('#reply-control.open');
    const bottom = Math.min(box.bottom, window.innerHeight, composer ? composer.getBoundingClientRect().top : Infinity);
    const top = Math.max(box.top, headerBottom());
    return !document.hidden && bottom > top && r.height > 0 && Math.min(r.bottom, bottom) - Math.max(r.top, top) >= Math.min(80, r.height / 2);
  }

  function readerStartBoundary(s) {
    if (!s.reader || s.host.hidden || s.allowStart || !s.headCursor) return null;
    const tops = [...s.nodes].filter(([n]) => n !== 1).map(([, node]) => node.getBoundingClientRect()).filter(r => r.height > 0).map(r => r.top);
    return tops.length ? Math.max(0, window.scrollY + Math.min(...tops) - headerBottom() - 12) : null;
  }

  function readerNativeContext(s, posts) {
    const stream = s.renderer.controller.model.postStream;
    if (typeof stream.appendPost !== 'function' || typeof stream.prependPost !== 'function') return;
    const context = s.nativeContext ||= { stream, added: new Set() };
    s.renderer.run(() => {
      for (const raw of posts) {
        if (!raw || stream.posts.some(post => post.id === raw.id)) continue;
        const post = typeof raw.set === 'function' ? raw : s.renderer.store.createRecord('post', { ...raw });
        context.added.add(post.id);
        if (post.post_number === 1) stream.prependPost(post); else stream.appendPost(post);
      }
    });
  }

  async function readerFooter(s) {
    const controller = s.renderer.controller, model = controller.model, stream = model?.postStream;
    if (s !== state || Number(model?.id) !== s.id || !stream || typeof stream.appendPost !== 'function' || typeof model.updateFromJson !== 'function' || s.footerLoading || Date.now() < (s.footerRetryAt || 0) || s.footerHighest === s.highest && stream.loadedAllPosts) return;
    s.footerLoading = true;
    try {
      // 只补真实末帖以准备原生页尾，不用 updateFromJson 清空当前分页窗口。
      if (!stream.loadedAllPosts || model.suggested_topics === undefined && model.related_topics === undefined) {
        const data = await readerFetch(s, `/t/${s.id}/${s.highest}.json`), tail = data.post_stream;
        if (Number(data.id) !== s.id || !tail?.posts?.some(p => p.id === tail.stream?.at(-1))) throw new Error('末页暂不可读取');
        s.renderer.run(() => {
          data.categories?.forEach(category => model.site.updateCategory(category));
          model.updateFromJson(data);
        });
        await s.renderer.run(() => model.constructor.applyTransformations?.([model]));
        if (s !== state) return;
        readerNativeContext(s, [tail.posts.find(post => post.id === tail.stream.at(-1))]);
      }
      if (s !== state) return;
      s.renderer.run(() => {
        stream.notifyPropertyChange?.('loadedAllPosts');
        controller.notifyPropertyChange?.('loadedAllPosts');
      });
      s.footerHighest = s.highest;
    } catch { s.footerRetryAt = Date.now() + 30000; }
    finally { s.footerLoading = false; if (s === state) scheduleProgress(); }
  }

  function readerFooterVisibility(s) {
    const settled = !s.host.hidden && !s.loadingNext && !s.countingRoots && (s.tailOnly || s.cursor >= s.ids.length && !s.rootRemaining?.size || s.nextError);
    if (settled || s.initError) s.footerRevealed = true;
    const value = s.footerRevealed ? 'shown' : 'pending';
    for (const node of document.querySelectorAll('.topic-map.--bottom, #topic-footer-buttons, .more-topics__container')) {
      if (node.dataset.ldtFooter !== value) node.dataset.ldtFooter = value;
    }
  }

  function updateReader(s) {
    if (s !== state) return;
    const boundary = readerStartBoundary(s);
    if (s.dragRatio === undefined && !s.locating && boundary !== null && s.lastScrollY !== undefined && window.scrollY < s.lastScrollY - 2 && window.scrollY < boundary - 2) {
      window.scrollTo({ top: boundary, behavior: 'auto' });
      readerPrevious(s);
    }
    const now = Date.now();
    for (const [number, node] of s.nodes) {
      const badge = node.querySelector('.ldt-unread');
      if (s.pending.has(number) && !s.read.has(number)) {
        const names = node.querySelector('.names');
        if (names && !badge) names.append(element('span', 'ldt-unread', '新回复'));
      } else badge?.remove();
    }
    let waiting = false;
    for (const [number, node] of s.nodes) {
      if (s.read.has(number)) continue;
      if (!readerVisible(s, node)) { s.dwell.delete(number); continue; }
      if (!s.dwell.has(number)) s.dwell.set(number, now);
      if (now - s.dwell.get(number) < 700) { waiting = true; continue; }
      s.read.add(number); s.pending.delete(number);
      node.querySelector('.ldt-unread')?.remove();
      node.removeAttribute('data-ldt-unread');
    }
    clearTimeout(s.readTimer);
    if (waiting) s.readTimer = setTimeout(() => updateReader(s), 720);
    const saved = JSON.stringify({ read: [...s.read], pending: [...s.pending] });
    if (saved !== s.savedReading) {
      s.savedReading = saved;
      if (typeof GM_setValue === 'function') GM_setValue(`topic-reading:${s.id}`, JSON.parse(saved));
    }
    const count = s.pending.size;
    s.unreadButton.hidden = !count;
    s.unreadButton.textContent = `↑ ${count} 条新回复`;
    const status = s.initError ? '评论加载失败，可切换引用模式使用原页面' : s.locateError ? '定位失败，请重试' : s.loadingPrevious ? '正在加载前面的回复…' : s.previousError ? '前面的回复暂时加载失败，上滑重试' : '评论';
    if (s.status.textContent !== status) s.status.textContent = status;
    const rect = s.reader.getBoundingClientRect();
    const header = headerBottom();
    const composer = document.querySelector('#reply-control.open');
    const bottom = Math.min(window.innerHeight, composer ? composer.getBoundingClientRect().top : Infinity);
    const upward = s.lastScrollY !== undefined && window.scrollY < s.lastScrollY - 2;
    s.lastScrollY = window.scrollY;
    const first = s.nodes.get(s.headNumber)?.getBoundingClientRect();
    if (s.dragRatio === undefined && !s.locating && upward && !s.host.hidden && s.headCursor > 0 && !s.loadingPrevious && first?.top > header - 240 && first.top < bottom + 240) readerPrevious(s);
    const complete = s.tailOnly || s.cursor >= s.ids.length && !s.rootRemaining?.size;
    const atEnd = complete && rect.bottom <= bottom + 24;
    const position = Math.max(0, Math.min(1, (header + 12 - rect.top) / Math.max(1, rect.height)));
    renderProgress(s, s.dragRatio ?? (atEnd ? 1 : threadProgress(s, rect, position)), atEnd);
    readerMoreState(s);
    readerFooterVisibility(s);
    const edge = s.more.getBoundingClientRect();
    const nearEnd = edge.height > 0 && edge.top < window.innerHeight + 240 && edge.bottom > headerBottom();
    if (!document.hidden && nearEnd) readerFooter(s);
    if (s.dragRatio === undefined && !s.locating && !document.hidden && nearEnd && !s.more.disabled && !s.nextError && !s.initError && !s.loadingNext && !s.nextTimer) {
      s.nextTimer = setTimeout(() => {
        s.nextTimer = null;
        const current = s.more.getBoundingClientRect();
        if (s === state && s.dragRatio === undefined && !s.locating && !document.hidden && current.top < window.innerHeight + 240 && current.bottom > headerBottom()) readerNext(s);
      }, 500);
    }
    updateConnectors();
  }

  function readerJump(s, number) {
    const node = s.nodes.get(number);
    if (!node) { location.assign(`/t/topic/${s.id}/${number}`); return; }
    window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - headerBottom() - 12, behavior: 'auto' });
    s.lastScrollY = window.scrollY;
    node.classList.add('ldt-focus');
    setTimeout(() => node.classList.remove('ldt-focus'), 1600);
    updateReader(s);
  }

  function readerEnd(s) {
    const composer = document.querySelector('#reply-control.open');
    const bottom = Math.min(window.innerHeight, composer ? composer.getBoundingClientRect().top : Infinity);
    window.scrollTo({ top: Math.max(0, window.scrollY + s.more.getBoundingClientRect().bottom - bottom), behavior: 'auto' });
    s.lastScrollY = window.scrollY;
    updateReader(s);
  }

  async function readerFetch(s, path) {
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        if (s !== state || s.abort.signal.aborted) throw new Error('已离开话题');
        response = await fetch(path, { credentials: 'same-origin', signal: s.abort.signal, headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
        if (!response.ok) throw new Error('加载失败，请重试');
        const data = await response.json();
        if (s !== state || s.abort.signal.aborted) throw new Error('已离开话题');
        return data;
      } catch (error) {
        if (s !== state || s.abort.signal.aborted || error.name === 'AbortError' || attempt >= 2 || response && !response.ok && response.status < 500) throw error;
      }
      // 短暂断连或服务繁忙时留在加载状态；切换话题后立即取消等待。
      await new Promise((resolve, reject) => {
        const cancel = () => { clearTimeout(timer); reject(new Error('已离开话题')); };
        const timer = setTimeout(() => { s.abort.signal.removeEventListener('abort', cancel); resolve(); }, (attempt + 1) * 500);
        s.abort.signal.addEventListener('abort', cancel, { once: true });
      });
    }
  }

  function nativeRenderer() {
    const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const load = page.require;
    const controller = load('discourse/lib/get-owner').getOwnerWithFallback().lookup('controller:topic');
    const store = load('discourse/lib/get-owner').getOwnerWithFallback().lookup('service:store');
    const { getOwner, setOwner } = load('@ember/application');
    const { default: Component, getComponentTemplate } = load('@ember/component');
    const { run } = load('@ember/runloop');
    const owner = getOwner(store);
    const template = getComponentTemplate(load('discourse/components/render-glimmer-container').default);
    const Post = load('discourse/components/post').default;
    if (!owner || !template || !controller?.model || !Post) throw new Error('原站帖子组件不可用');
    return { controller, store, owner, Component, template, Post, setOwner, run, curry: load('ember-curry-component').default };
  }

  function syncComposer(s) {
    const owner = (s.renderer || nativeRenderer()).owner;
    const composer = owner.lookup('service:composer');
    const events = owner.lookup('service:app-events');
    if (typeof composer?.save !== 'function' || !events?.on || !events?.off) return;
    const original = composer.save;
    function save(force, options = {}) {
      if (s === state && mode === 'thread' && this.model?.action === 'reply' && Number(this.model.topic?.id) === s.id) {
        return original.call(this, force, { ...options, jump: false });
      }
      return original.apply(this, arguments);
    }
    const created = async post => {
      if (s !== state || Number(post?.topic_id) !== s.id || !Number.isSafeInteger(post.post_number) || !Number.isSafeInteger(post.id) || post.id <= 0) return;
      if (!s.reader) {
        s.seenNew?.add(post.post_number); s.updates?.delete(post.post_number);
        const anchor = Number(nativeTopic()?.posts_count) > 20 ? readingAnchor(s) : null;
        if (anchor) modeAnchor = { id: s.id, number: Number(anchor.dataset.postNumber), top: anchor.getBoundingClientRect().top };
        schedule(); return;
      }
      s.read.add(post.post_number); s.pending.delete(post.post_number);
      if (!s.ids.includes(post.id)) s.ids.push(post.id);
      s.total = Math.max(s.total, s.ids.length);
      try {
        // 成功事件携带服务器确认的原生模型，不等待后台轮询，也不展示待审核的临时帖子。
        const raw = post.cooked ? post : await readerFetch(s, `/posts/by_number/${s.id}/${post.post_number}`);
        await readerAdd(s, [raw], true);
        if (s !== state) return;
        const node = s.nodes.get(post.post_number);
        node?.classList.add('ldt-focus');
        setTimeout(() => node?.classList.remove('ldt-focus'), 1600);
        await readerRootCount(s);
        if (s === state) updateReader(s);
      } catch { if (s === state) readerCheck(s); }
    };
    composer.save = save;
    events.on('post:created', created);
    s.stopReplySync = () => {
      events.off('post:created', created);
      if (composer.save === save) composer.save = original;
      s.stopReplySync = null;
    };
  }

  function readerNode(s, raw) {
    const node = element('div', 'topic-post ldt-native-post'); node.dataset.postNumber = raw.post_number;
    if (raw.username === s.owner) node.classList.add('topic-owner');
    const r = s.renderer;
    const post = typeof raw.set === 'function' ? raw : r.store.createRecord('post', { ...raw });
    if (post.topic !== r.controller.model) post.set('topic', r.controller.model);
    const args = { post, elementId: `ldt-post-${raw.post_number}`, streamElement: s.stream, canCreatePost: r.controller.model.details?.can_create_post, showReadIndicator: false };
    for (const name of ['replyToPost', 'editPost', 'deletePost', 'recoverPost', 'expandHidden', 'changeNotice', 'changePostOwner', 'grantBadge', 'lockPost', 'unlockPost', 'rebakePost', 'permanentlyDeletePost', 'togglePostType', 'toggleWiki', 'unhidePost', 'togglePostSelection', 'selectBelow', 'selectReplies', 'cancelFilter']) {
      args[name] = (...extra) => r.controller.send(name, post, ...extra);
    }
    args.showFlags = () => r.controller.send('showPostFlags', post);
    for (const name of ['showHistory', 'showRawEmail', 'showLogin', 'showPagePublish']) args[name] = (...extra) => r.controller.send(name, post, ...extra);
    args.updateTopicPageQueryParams = () => r.controller.send('updateTopicPageQueryParams');
    const target = element('div', 'ldt-native-content'); node.append(target);
    const properties = { renderGlimmer: { _registrations: [{ element: target, component: r.curry(r.Post, args, r.owner) }] } };
    r.setOwner(properties, r.owner);
    const wrapper = r.Component.extend({ layout: r.template }).create(properties);
    s.stream.append(node);
    try { r.run(() => wrapper.appendTo(node)); } catch (error) { r.run(() => wrapper.destroy()); node.remove(); throw error; }
    s.views.set(raw.post_number, wrapper);
    return node;
  }

  function readerArrange(s, anchor) {
    const positions = layout(s, [...s.nodes.values()]);
    for (const node of s.nodes.values()) {
      const n = Number(node.dataset.postNumber), p = positions.get(n);
      if (n === 1) { node.style.order = '0'; continue; }
      node.dataset.ldtDepth = p.depth;
      const names = node.querySelector('.names');
      if (names && node.classList.contains('topic-owner') && !names.querySelector('.ldt-owner-label')) {
        const badge = element('span', 'ldt-owner-label', 'OP');
        badge.title = '话题发起者';
        const author = names.querySelector(':scope > .first');
        if (author) author.after(badge); else names.append(badge);
      }
      const parent = s.posts.get(s.posts.get(n)?.parent);
      if (names && parent && parent.number !== 1 && !names.querySelector('.ldt-relation')) {
        const relation = element('button', 'ldt-relation', `回复 ${parent.author}`); relation.type = 'button'; relation.addEventListener('click', () => readerJump(s, parent.number)); names.append(relation);
      }
      node.style.order = p.rank;
      node.style.setProperty('--ldt-indent', Math.min(2, Math.max(0, p.depth - 1)));
      delete node.dataset.ldtFirst; delete node.dataset.ldtLast; delete node.dataset.ldtRoot;
    }
    const groups = new Map();
    for (const [n, p] of positions) if (p.depth && s.nodes.has(n)) {
      if (!groups.has(p.root)) groups.set(p.root, []);
      groups.get(p.root).push(s.nodes.get(n));
    }
    for (const [root, nodes] of groups) {
      s.nodes.get(root)?.setAttribute('data-ldt-root', '');
      nodes[0].dataset.ldtFirst = ''; nodes.at(-1).dataset.ldtLast = '';
    }
    if (anchor?.node.isConnected) {
      const delta = anchor.node.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "auto" });
    }
    updateReader(s);
  }

  async function readerAdd(s, posts, initial = false) {
    const added = [];
    for (const post of posts) if (Number.isSafeInteger(post.post_number) && Number.isSafeInteger(post.id) && (!post.topic_id || post.topic_id === s.id)) { s.raw.set(post.post_number, post); s.rootRemaining?.delete(post.id); }
    // 只补当前回复缺少的直接父评论，不抓取父子楼号之间的整段帖子。
    const missing = [...new Set(posts.map(p => p.reply_to_post_number).filter(n => n > 1 && !s.raw.has(n)))].slice(0, 20);
    if (missing.length) {
      for (const number of missing) {
        try {
          const p = await readerFetch(s, `/posts/by_number/${s.id}/${number}`);
          if (p.post_number === number && Number.isSafeInteger(p.id) && (!p.topic_id || p.topic_id === s.id)) s.raw.set(number, p);
        } catch (error) { if (s !== state || s.abort.signal.aborted) throw error; }
      }
    }
    // 网络等待期间用户仍可能滚动，只在真正插入和重排前记录当前位置。
    const anchorNode = [...s.nodes.values()].filter(n => readerVisible(s, n)).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    const anchor = anchorNode ? { node: anchorNode, top: anchorNode.getBoundingClientRect().top } : null;
    merge(s, [...s.raw.values()]);
    for (const post of s.raw.values()) if (!s.nodes.has(post.post_number)) {
      const node = readerNode(s, post); s.nodes.set(post.post_number, node); s.stream.append(node); added.push(node);
    }
    readerArrange(s, anchor);
    if (!initial) for (const node of added) if (Number(node.dataset.postNumber) !== 1 && !s.read.has(Number(node.dataset.postNumber)) && node.getBoundingClientRect().bottom <= Math.max(s.reader.getBoundingClientRect().top, headerBottom()) + 12) s.pending.add(Number(node.dataset.postNumber));
    updateReader(s);
  }

  function readerMoreState(s) {
    if (s.loadingNext || s.initError || !s.ids.length) return;
    const unfinished = !s.tailOnly && !!s.rootRemaining?.size;
    s.more.disabled = s.tailOnly || s.cursor >= s.ids.length && !unfinished;
    s.more.toggleAttribute('data-ldt-retry', !!s.nextError);
    s.more.setAttribute('role', s.nextError ? 'button' : 'status');
    s.more.tabIndex = s.nextError ? 0 : -1;
    const text = s.nextError ? '加载失败 · 点击重试' : !s.tailOnly && (s.cursor < s.ids.length || unfinished) ? '继续向下阅读' : s.tailOnly || s.nodes.size >= s.total ? '已到帖末' : '已到当前评论末尾，回复随阅读展开';
    if (s.more.textContent !== text) s.more.textContent = text;
  }

  async function readerNext(s) {
    if (s.more.disabled || s.tailOnly) return;
    if (s.initError) { cleanup(); refresh(); return; }
    s.nextError = false; s.loadingNext = true; s.more.disabled = true; s.more.textContent = '正在加载…';
    try {
      const chronological = s.cursor < s.ids.length;
      const ids = chronological ? s.ids.slice(s.cursor, s.cursor + 20) : [...(s.rootRemaining || [])].slice(0, 20);
      if (!ids.length) { s.more.disabled = true; return; }
      const data = await readerFetch(s, `/t/${s.id}/posts.json?${ids.map(n => `post_ids[]=${n}`).join('&')}`);
      const posts = data.post_stream?.posts || [];
      if (!chronological && !posts.some(p => s.rootRemaining.has(p.id))) throw new Error('缺失回复暂不可读取');
      await readerAdd(s, posts, !chronological);
      if (chronological) s.cursor += ids.length;
      s.more.textContent = s.cursor >= s.ids.length ? '本段已到末尾' : '继续阅读 · 下一组 20 帖';
      s.more.disabled = s.cursor >= s.ids.length;
    } catch { if (s === state) { s.nextError = true; s.more.textContent = '加载失败 · 点击重试'; s.more.disabled = false; } }
    finally { s.loadingNext = false; if (s === state) updateReader(s); }
  }

  async function readerPrevious(s) {
    if (s.loadingPrevious || !s.headCursor) return;
    s.loadingPrevious = true; s.previousError = false;
    try {
      const start = Math.max(0, s.headCursor - 20), ids = s.ids.slice(start, s.headCursor);
      const data = await readerFetch(s, `/t/${s.id}/posts.json?${ids.map(id => `post_ids[]=${id}`).join('&')}`);
      const posts = data.post_stream?.posts || [];
      if (!posts.length) throw new Error('前段回复暂不可读取');
      await readerAdd(s, posts, true);
      s.headCursor = start;
      s.headNumber = posts.find(p => p.id === s.ids[start])?.post_number || Math.min(...posts.map(p => p.post_number));
      if (!start) s.allowStart = true;
    } catch { if (s === state) s.previousError = true; }
    finally { s.loadingPrevious = false; if (s === state) updateReader(s); }
  }

  async function readerRootCount(s) {
    s.countingRoots = (s.countingRoots || 0) + 1;
    try {
      const data = await readerFetch(s, `/t/${s.id}.json?filter_top_level_replies=true`);
      if ((data.post_stream?.posts || []).some(p => Number(p.reply_to_post_number) > 0)) return;
      const ids = data.post_stream?.stream;
      if (!Array.isArray(ids)) return;
      const first = s.raw.get(1);
      s.rootIds = new Map([...new Set(ids.filter(id => Number.isSafeInteger(id) && id !== first?.id))].map((id, index) => [id, index]));
      const loaded = new Set([...s.raw.values()].map(p => p.id));
      s.rootRemaining = new Set([...s.rootIds.keys()].filter(id => !loaded.has(id)));
      // 统计接口已经返回的正文直接复用，补齐从中间楼层进入时漏掉的前段回复。
      const missing = (data.post_stream.posts || []).filter(p => s.rootRemaining.has(p.id));
      if (!s.tailOnly && s.rootIds.size <= 20 && missing.length) await readerAdd(s, missing, true);
    } catch { /* 统计失败时不展示推算的总数，也不影响阅读。 */ }
    finally { s.countingRoots--; }
  }

  function rootCountLabel(s) {
    if (s.reader) {
      if (!s.rootIds) return '';
      const loaded = [...s.raw.values()].filter(p => s.rootIds.has(p.id)).length;
      return `已加载 ${loaded} / 共 ${s.rootIds.size} 条顶层回复`;
    }
    if (!s.total || s.posts.size < s.total) return '';
    const roots = [...s.posts.values()].filter(p => p.number > 1 && !p.parent);
    const rendered = new Set([...s.stream.querySelectorAll(':scope > [data-post-number]:not(.post-stream--cloaked)')].map(n => Number(n.dataset.postNumber)));
    return `已加载 ${roots.filter(p => rendered.has(p.number)).length} / 共 ${roots.length} 条顶层回复`;
  }

  async function readerCheck(s) {
    if (s !== state || s.checking || s.initError || document.hidden) return;
    s.checking = true;
    try {
      const data = await readerFetch(s, `/t/${s.id}.json`);
      const ids = (data.post_stream?.stream || []).filter(Number.isSafeInteger);
      const previous = s.highest || 0;
      const latest = Number(data.highest_post_number) || previous;
      const previousCursor = s.ids[s.cursor - 1];
      s.ids = ids; s.total = data.posts_count || s.total;
      if (previousCursor && ids.includes(previousCursor)) s.cursor = ids.indexOf(previousCursor) + 1;
      if (latest > previous) {
        const page = await readerFetch(s, `/t/${s.id}/${previous + 1}.json`);
        const fresh = (page.post_stream?.posts || []).filter(p => p.post_number > previous);
        await readerAdd(s, fresh);
        for (const post of fresh) if (!s.read.has(post.post_number)) s.pending.add(post.post_number);
        s.highest = fresh.length ? Math.max(...fresh.map(p => p.post_number)) : latest;
        await readerRootCount(s);
      }
      updateReader(s);
    } catch { /* 后台检查失败不打断阅读，下次继续检查。 */ }
    finally { s.checking = false; }
  }

  function startReader(native, id) {
    const renderer = nativeRenderer();
    cleanup();
    const stored = typeof GM_getValue === 'function' ? GM_getValue(`topic-reading:${id}`, {}) : {};
    const s = state = { id, native, renderer, views: new Map(), posts: new Map(), raw: new Map(), nodes: new Map(), ids: [], cursor: 0, replyAfter: new Map(), read: new Set((Array.isArray(stored?.read) ? stored.read : []).filter(Number.isSafeInteger)), pending: new Set((Array.isArray(stored?.pending) ? stored.pending : []).filter(Number.isSafeInteger)), dwell: new Map(), abort: new AbortController() };
    s.host = element('section', 'ldt-independent'); s.host.hidden = true;
    s.reader = element('div', 'ldt-reader-window'); s.reader.tabIndex = 0; s.reader.setAttribute('aria-label', '楼中楼评论区');
    s.stream = element('div', 'post-stream ldt-owned ldt-active ldt-thread'); s.reader.append(s.stream);
    s.bar = modebar(s); s.status = element('span', 'ldt-reader-status', '正在加载评论…');
    const toolbar = element('div', 'ldt-reader-toolbar'); toolbar.append(s.status, s.bar);
    s.unreadButton = element('button', 'ldt-reader-unread'); s.unreadButton.type = 'button'; s.unreadButton.hidden = true;
    s.unreadButton.addEventListener('click', () => {
      const targets = [...s.pending].sort((a, b) => Number(s.nodes.get(a)?.style.order || Infinity) - Number(s.nodes.get(b)?.style.order || Infinity));
      readerJump(s, targets[0]);
    });
    s.more = element('div', 'ldt-reader-more', '正在加载…'); s.more.setAttribute('role', 'status'); s.more.disabled = true;
    s.more.addEventListener('click', () => { if (s.nextError || s.initError) readerNext(s); });
    s.more.addEventListener('keydown', e => { if ((s.nextError || s.initError) && ['Enter', ' '].includes(e.key)) { e.preventDefault(); readerNext(s); } });
    s.host.append(toolbar, s.unreadButton, s.reader, s.more); native.before(s.host);
    s.bar.querySelector('[data-mode="thread"]').setAttribute('aria-pressed', 'true');
        watchConnectors(s.stream);
    s.style = element('style', 'ldt-layout'); document.head.append(s.style);
    const parts = location.pathname.split('/').filter(Boolean);
    const target = modeAnchor?.id === id ? modeAnchor.number : Number(parts[/^\d+$/.test(parts[1] || '') ? 2 : 3]) || 1;
    let endJump = false;
    try { endJump = sessionStorage.getItem('ldt-jump-end') === String(id); sessionStorage.removeItem('ldt-jump-end'); } catch {}
    (async () => {
      try {
        const model = renderer.controller.model;
        const cached = [...(model.postStream?.posts || [])];
        const cachedIds = [...(model.postStream?.stream || [])];
        const reusable = Number(model.id) === id && cachedIds.length === Number(model.posts_count) && cached.some(p => Number(p.post_number) === target);
        let data = reusable ? { posts_count: model.posts_count, highest_post_number: model.highest_post_number, details: model.details, post_stream: { stream: cachedIds, posts: cached } } : await readerFetch(s, target > 1 ? `/t/${id}/${target}.json` : `/t/${id}.json`);
        if (endJump && data.highest_post_number > target && !data.post_stream?.posts?.some(p => p.post_number === data.highest_post_number)) data = await readerFetch(s, `/t/${id}/${data.highest_post_number}.json`);
        const roots = data;
        s.ids = (roots.post_stream?.stream || []).filter(Number.isSafeInteger);
        s.total = data.posts_count || s.ids.length; s.highest = data.highest_post_number || s.total;
        s.tailOnly = endJump || target > 1 && target >= s.highest;
        s.owner = data.details?.created_by?.username || data.post_stream?.posts?.find(p => p.post_number === 1)?.username;
        const posts = [...(data.post_stream?.posts || [])];
        const first = posts.filter(p => p.post_number > 1).sort((a, b) => a.post_number - b.post_number)[0];
        s.headCursor = first ? Math.max(0, s.ids.indexOf(first.id)) : 0;
        s.headNumber = first?.post_number;
        s.allowStart = target <= 1 || !s.headCursor;
        // 只筛选主评论的分页可能不包含首帖，必须单独保留主题正文。
        if (!posts.some(p => p.post_number === 1)) {
          const first = roots.post_stream?.posts?.find(p => p.post_number === 1) || await readerFetch(s, `/posts/by_number/${id}/1`);
          if (first.post_number !== 1 || !Number.isSafeInteger(first.id) || (first.topic_id && first.topic_id !== id)) throw new Error('首帖数据不可用');
          posts.unshift(first);
          if (!s.owner) s.owner = first.username;
        }
        s.cursor = 0;
        await readerAdd(s, posts, true);
        readerNativeContext(s, [s.raw.get(1)]);
        s.host.hidden = false; native.classList.add('ldt-native-hidden');
        syncComposer(s);
        s.checkTimer = setInterval(() => readerCheck(s), 60000);
        readerRootCount(s).then(() => { if (s === state) updateReader(s); });
        s.cursor = Math.max(0, ...[...s.raw.values()].map(p => s.ids.indexOf(p.id) + 1));
        s.more.disabled = s.cursor >= s.ids.length;
        s.more.textContent = s.more.disabled ? '本段已到末尾' : '继续阅读 · 下一组 20 帖';
        if (modeAnchor?.id === id && s.nodes.has(modeAnchor.number)) {
          window.scrollBy(0, s.nodes.get(modeAnchor.number).getBoundingClientRect().top - modeAnchor.top); modeAnchor = null;
        } else if (s.tailOnly) readerEnd(s);
        else if (target > 1 && s.nodes.has(target)) readerJump(s, target);
        updateProgress(s);
        readerFooter(s);
      } catch (error) { if (s === state) { s.host.hidden = false; s.status.textContent = '评论加载失败，可切换引用模式使用原页面'; s.more.textContent = '重新加载'; s.more.disabled = false; s.initError = true; s.native.classList.remove('ldt-native-hidden'); s.reader.hidden = true; s.more.setAttribute('data-ldt-retry', ''); s.more.setAttribute('role', 'button'); s.more.tabIndex = 0; readerFooterVisibility(s); } }
    })();
  }

  function refresh() {
    observer.disconnect();
    updateSidepeek();
    const id = topicId();
    const stream = document.querySelector('.post-stream:not(.ldt-owned)');
    if (state?.reader && (!enabled || mode !== 'thread' || state.id !== id || state.native !== stream)) cleanup();
    const model = nativeTopic();
    if (enabled && mode === 'thread' && stream && (state?.reader || Number(model?.id) === id && Number(model?.posts_count) > 20 && model?.postStream?.posts?.some?.(p => Number(p.id) > 0) || state?.id === id && Number(state?.topicData?.posts_count) > 20)) {
      if (!state?.reader) { try { startReader(stream, id); } catch (error) { enabled = false; stream.classList.remove('ldt-native-hidden'); const notice = element('div', 'ldt-native-error', '评论整理暂不可用，已保留原页面'); stream.before(notice); } }
      else updateProgress(state);
      updateConnectors(); observe(); return;
    }
    if (!enabled || !id || !stream) { cleanup(); updateConnectors(); observe(); return; }
    if (state?.id !== id || state.stream !== stream) {
      cleanup();
      state = { id, stream, posts: new Map(), requested: new Set(), abort: new AbortController(), queue: Promise.resolve(), nextRequest: 0 };
      state.bar = modebar(state);
      state.style = element('style', 'ldt-layout');
      document.head.append(state.style);
    }
    const s = state;
    if (mode === 'thread' && !s.stopReplySync) { try { syncComposer(s); } catch { /* 原生组件未准备好时仍可正常回复。 */ } }
    else if (mode !== 'thread') s.stopReplySync?.();
    if (mode === 'quote' && modeAnchor?.id === id) {
      const original = renderedPost(s, modeAnchor.number);
      if (original) { window.scrollBy(0, original.getBoundingClientRect().top - modeAnchor.top); modeAnchor = null; }
    }
    watchConnectors(stream);
    const anchor = readingAnchor(s);
    const anchorTop = anchor?.getBoundingClientRect().top;
    if (!snapshot(s) && !s.posts.size) load(s);
    syncUpdates(s);
    const wrappers = [...stream.children].filter(n => Number(n.dataset.postNumber) > 0);
    const positions = layout(s, wrappers);
    stream.classList.add('ldt-active');
    stream.classList.toggle('ldt-thread', mode === 'thread');
    const op = wrappers.find(n => Number(n.dataset.postNumber) === 1);
    const stats = op?.querySelector('.topic-map__stats');
    if (stats && s.bar.parentElement !== stats) stats.append(s.bar);
    else if (!stats && op && op.nextElementSibling !== s.bar) op.after(s.bar);
    else if (!stats && !op && stream.firstElementChild !== s.bar) stream.prepend(s.bar);
    s.bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    const rules = [];
    const branches = new Map();
    for (const wrapper of wrappers) {
      const number = Number(wrapper.dataset.postNumber);
      if (number === 1) continue;
      const post = s.posts.get(number);
      const position = positions.get(number);
      wrapper.dataset.ldtDepth = position.depth;
      rules.push(`.post-stream.ldt-thread > [data-post-number="${number}"] { order: ${position.rank}; --ldt-indent: ${Math.min(2, Math.max(0, position.depth - 1))}; }`);
      delete wrapper.dataset.ldtFirst;
      delete wrapper.dataset.ldtLast;
      delete wrapper.dataset.ldtRoot;
      delete wrapper.dataset.ldtConnected;
      if (position.depth > 0) {
        if (!branches.has(position.root)) branches.set(position.root, []);
        branches.get(position.root).push(wrapper);
      }
      const names = [...wrapper.querySelectorAll('.topic-body > .topic-meta-data .names')]
        .find(n => !n.closest('.embedded-posts'));
      let badge = names?.querySelector('.ldt-owner-label');
      if (names && wrapper.classList.contains('topic-owner')) {
        if (!badge) badge = element('span', 'ldt-owner-label', 'OP');
        badge.title = '话题发起者';
        const author = names.querySelector(':scope > .first');
        if (author && author.nextElementSibling !== badge) author.after(badge);
        else if (!author && badge.parentElement !== names) names.append(badge);
      } else badge?.remove();
      let relation = wrapper.querySelector('.ldt-relation');
      if (post?.parent > 1 && names) {
        if (!relation) {
          relation = element('button', 'ldt-relation');
          relation.type = 'button';
          relation.addEventListener('click', () => jumpToPost(s, s.posts.get(number)?.parent));
          relation.title = '定位被回复的评论';
          names.append(relation);
        }
        const parent = s.posts.get(post.parent);
        const author = parent?.author || post.parentAuthor;
        const label = author ? `回复 ${author}` : '回复此前的评论';
        if (relation.textContent !== label) relation.textContent = label;
        if (!parent) load(s, post.parent);
      } else relation?.remove();
      updateQuote(s, wrapper, post);
    }
    for (const [root, replies] of branches) {
      const parent = wrappers.find(n => Number(n.dataset.postNumber) === root);
      if (parent && !parent.classList.contains('post-stream--cloaked')) parent.dataset.ldtRoot = '';
      replies.sort((a, b) => positions.get(Number(a.dataset.postNumber)).rank - positions.get(Number(b.dataset.postNumber)).rank);
      replies[0].dataset.ldtFirst = '';
      if (parent && !parent.classList.contains('post-stream--cloaked')) replies[0].dataset.ldtConnected = '';
      replies.at(-1).dataset.ldtLast = '';
    }
    // 原生加载边界、时间分隔线仍跟随对应楼层，不参与回复关系排序。
    const children = [...stream.children];
    children.forEach((node, i) => {
      if (node === s.bar || node.dataset.postNumber || node.classList.contains('ldt-connectors')) return;
      const next = children.slice(i + 1).find(n => Number(n.dataset.postNumber) > 0);
      node.dataset.ldtRank = i;
      const rank = next ? (positions.get(Number(next.dataset.postNumber))?.rank || 0) - 1 : (positions.size + 3) * 10;
      rules.push(`.post-stream.ldt-thread > [data-ldt-rank="${i}"] { order: ${rank}; }`);
    });
    const css = rules.join('\n');
    if (s.style.textContent !== css) s.style.textContent = css;
    if (anchor && anchorTop !== undefined) {
      const delta = anchor.getBoundingClientRect().top - anchorTop;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    }
    updateProgress(s);
    updateConnectors();
    observe();
  }

  function schedule() { if (timer) return; timer = requestAnimationFrame(() => { timer = 0; refresh(); }); }
  if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('开启 / 关闭评论整理', () => { enabled = !enabled; refresh(); });
  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', event => { if (event.persisted) { progressFrame = 0; schedule(); } });
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('wheel', event => {
    if (event.deltaY >= 0 || event.ctrlKey || event.metaKey || !state?.reader || !(event.target instanceof Node) || !state.reader.contains(event.target)) return;
    if (event.target.closest?.('pre, textarea, [role="dialog"], #reply-control')) return;
    const boundary = readerStartBoundary(state);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (boundary !== null && window.scrollY + delta < boundary) {
      event.preventDefault();
      window.scrollTo({ top: boundary, behavior: 'auto' });
      readerPrevious(state);
    }
  }, { passive: false });
  window.addEventListener('resize', scheduleProgress);
  document.addEventListener('visibilitychange', () => { scheduleProgress(); if (!document.hidden && state?.reader) readerCheck(state); });
  document.addEventListener('load', scheduleProgress, true);
  document.addEventListener('scroll', scheduleProgress, { passive: true, capture: true });
  window.addEventListener('click', event => {
    if (!state || mode !== 'thread' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const date = event.target.closest?.('.timeline-container:not(.timeline-fullscreen) .start-date, .timeline-container:not(.timeline-fullscreen) .now-date');
    if (!date) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.locating = null; state.dragRatio = undefined; clearTimeout(state.nextTimer); state.nextTimer = null;
    if (!date.classList.contains('start-date')) { jumpToEnd(state, date.href); return; }
    if (state.reader) {
      // 单独补取的首帖不代表首屏回复已加载，深链接回开头交给原站重建首屏。
      const firstPage = state.ids.slice(0, Math.min(20, state.ids.length));
      const loaded = new Set([...state.raw.values()].map(post => post.id));
      if (!firstPage.every(id => loaded.has(id))) { location.assign(`/t/topic/${state.id}/1`); return; }
      state.tailOnly = false; state.allowStart = true;
      window.scrollTo({ top: 0, behavior: 'auto' }); updateProgress(state);
    } else if (renderedPost(state, 1)) window.scrollTo({ top: 0, behavior: 'auto' });
    else location.assign(`/t/topic/${state.id}/1`);
  }, true);
  setInterval(() => { if (enabled && topicId() !== (state?.id || 0)) schedule(); }, 1000);
  if (document.documentElement) refresh();
  else document.addEventListener('DOMContentLoaded', refresh, { once: true });
})();
