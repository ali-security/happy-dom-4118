import IWindow from '../../src/window/IWindow.js';
import Window from '../../src/window/Window.js';
import IDocument from '../../src/nodes/document/IDocument.js';
import Event from '../../src/event/Event.js';
import CustomElement from '../CustomElement.js';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import IEventTarget from '../../src/event/IEventTarget.js';

describe('Event', () => {
	let window: IWindow;
	let document: IDocument;

	beforeEach(() => {
		window = new Window();
		document = window.document;

		window.customElements.define('custom-element', CustomElement);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('get target()', () => {
		it('Returns target.', () => {
			const event = new Event('click', { bubbles: true });
			expect(event.target === null).toBe(true);

			const div = document.createElement('div');
			const span = document.createElement('span');

			div.appendChild(span);

			span.dispatchEvent(event);

			expect(event.target === span).toBe(true);
		});
	});

	describe('get currentTarget()', () => {
		it('Returns current target.', () => {
			const event = new Event('click', { bubbles: true });
			expect(event.currentTarget === null).toBe(true);

			const div = document.createElement('div');
			const span = document.createElement('span');

			div.appendChild(span);

			span.dispatchEvent(event);

			expect(event.currentTarget === div).toBe(true);
		});
	});

	describe('get cancelBubble()', () => {
		it('Returns "true" if propagation has been stopped.', () => {
			const event = new Event('click');
			expect(event.cancelBubble).toBe(false);
			event.stopPropagation();
			expect(event.cancelBubble).toBe(true);
		});
	});

	describe('initEvent()', () => {
		it('Depracated way to init an event.', () => {
			const event = new Event('click');
			event.initEvent('newEventType', true, true);
			expect(event.type).toBe('newEventType');
			expect(event.bubbles).toBe(true);
			expect(event.cancelable).toBe(true);
		});
	});

	describe('preventDefault()', () => {
		it('Prevents default behaviour.', () => {
			const event = new Event('click');
			event.preventDefault();
			expect(event.defaultPrevented).toBe(true);
		});

		it("Doesn't prevent default if event is in a passive listener.", () => {
			const event = new Event('click', { bubbles: true });
			expect(event.currentTarget === null).toBe(true);

			const div = document.createElement('div');
			const span = document.createElement('span');

			div.appendChild(span);

			span.addEventListener(
				'click',
				(e: Event) => {
					e.preventDefault();
				},
				{ passive: true }
			);

			span.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(false);

			span.addEventListener('click', (e: Event) => {
				e.preventDefault();
			});

			span.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(true);
		});
	});

	describe('stopImmediatePropagation()', () => {
		it('Stops any proceeding listener from beeing called.', () => {
			const event = new Event('click', { bubbles: true });

			expect(event.currentTarget === null).toBe(true);

			const div = document.createElement('div');
			const span = document.createElement('span');
			let isSpanListenerCalled = false;
			let isDivListenerCalled = false;

			div.appendChild(span);

			span.addEventListener('click', (e: Event) => e.stopImmediatePropagation());
			span.addEventListener('click', () => (isSpanListenerCalled = true));
			div.addEventListener('click', () => (isDivListenerCalled = true));

			span.dispatchEvent(event);

			expect(isSpanListenerCalled).toBe(false);
			expect(isDivListenerCalled).toBe(false);
		});
	});

	describe('stopPropagation()', () => {
		it('Stops bubbling to the parent node.', () => {
			const event = new Event('click', { bubbles: true });

			expect(event.currentTarget === null).toBe(true);

			const div = document.createElement('div');
			const span = document.createElement('span');
			let isSpanListenerCalled = false;
			let isDivListenerCalled = false;

			div.appendChild(span);

			span.addEventListener('click', (e: Event) => e.stopPropagation());
			span.addEventListener('click', () => (isSpanListenerCalled = true));
			div.addEventListener('click', () => (isDivListenerCalled = true));

			span.dispatchEvent(event);

			expect(isSpanListenerCalled).toBe(true);
			expect(isDivListenerCalled).toBe(false);
		});
	});

	describe('get timeStamp()', () => {
		it('Returns the value returned by performance.now() at the time it was created.', () => {
			const performanceNow = 12345;
			vi.spyOn(performance, 'now').mockImplementation(() => {
				return performanceNow;
			});
			const event = new Event('click');
			expect(event.timeStamp).toBe(performanceNow);
		});
	});

	describe('composedPath()', () => {
		it('Returns a composed path.', () => {
			const div = document.createElement('div');
			const span = document.createElement('span');
			let composedPath: IEventTarget[] | null = null;

			div.appendChild(span);
			document.body.appendChild(div);

			div.addEventListener('click', (event: Event) => {
				composedPath = event.composedPath();
			});

			span.dispatchEvent(
				new Event('click', {
					bubbles: true
				})
			);

			expect((<IEventTarget[]>(<unknown>composedPath)).length).toBe(6);
			expect((<IEventTarget[]>(<unknown>composedPath))[0] === span).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[1] === div).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[2] === document.body).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[3] === document.documentElement).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[4] === document).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[5] === window).toBe(true);
		});

		it('Goes through shadow roots if composed is set to "true".', () => {
			const div = document.createElement('div');
			const customELement = document.createElement('custom-element');
			let composedPath: IEventTarget[] | null = null;

			div.appendChild(customELement);

			document.body.appendChild(div);

			div.addEventListener('click', (event: Event) => {
				composedPath = event.composedPath();
			});

			customELement.shadowRoot.children[1].children[0].dispatchEvent(
				new Event('click', {
					bubbles: true,
					composed: true
				})
			);

			expect((<IEventTarget[]>(<unknown>composedPath)).length).toBe(9);
			expect(
				(<IEventTarget[]>(<unknown>composedPath))[0] ===
					customELement.shadowRoot.children[1].children[0]
			).toBe(true);
			expect(
				(<IEventTarget[]>(<unknown>composedPath))[1] === customELement.shadowRoot.children[1]
			).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[2] === customELement.shadowRoot).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[3] === customELement).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[4] === div).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[5] === document.body).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[6] === document.documentElement).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[7] === document).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[8] === window).toBe(true);
		});

		it('Does not go through shadow roots if composed is set to "false".', () => {
			const customELement = document.createElement('custom-element');
			let composedPath: IEventTarget[] | null = null;

			document.body.appendChild(customELement);

			customELement.shadowRoot.children[1].addEventListener('click', (event: Event) => {
				composedPath = event.composedPath();
			});

			customELement.shadowRoot.children[1].children[0].dispatchEvent(
				new Event('click', {
					bubbles: true
				})
			);

			expect((<IEventTarget[]>(<unknown>composedPath)).length).toBe(3);
			expect(
				(<IEventTarget[]>(<unknown>composedPath))[0] ===
					customELement.shadowRoot.children[1].children[0]
			).toBe(true);
			expect(
				(<IEventTarget[]>(<unknown>composedPath))[1] === customELement.shadowRoot.children[1]
			).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[2] === customELement.shadowRoot).toBe(true);
		});

		it('Returns correct composed for HTMLAnchorElement event target and composed is set to "true".', () => {
			const anchor = document.createElement('a');
			anchor.setAttribute('href', 'https://example.com');
			let composedPath: IEventTarget[] | null = null;

			document.body.appendChild(anchor);

			anchor.addEventListener('click', (event: Event) => {
				composedPath = event.composedPath();
			});

			anchor.dispatchEvent(
				new Event('click', {
					bubbles: true,
					composed: true
				})
			);

			expect((<IEventTarget[]>(<unknown>composedPath)).length).toBe(5);
			expect((<IEventTarget[]>(<unknown>composedPath))[0] === anchor).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[1] === document.body).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[2] === document.documentElement).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[3] === document).toBe(true);
			expect((<IEventTarget[]>(<unknown>composedPath))[4] === window).toBe(true);
		});
	});
});
