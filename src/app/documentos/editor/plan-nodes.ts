import { Node } from '@tiptap/core';
import DOMPurify from 'dompurify';

function fixedElement(attrs: Record<string, unknown>): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('data-plan-fixed', String(attrs['role']));
  element.setAttribute('contenteditable', 'false');
  element.innerHTML = DOMPurify.sanitize(String(attrs['html']));
  return element;
}

/** Identificação e assinaturas vêm do modelo e do perfil e ficam em modo leitura. */
export const PlanFixed = Node.create({
  name: 'planFixed', group: 'block', atom: true, selectable: false, draggable: false,
  addAttributes() {
    return {
      role: { default: 'header', parseHTML: element => element.getAttribute('data-plan-fixed') },
      html: { default: '', parseHTML: element => DOMPurify.sanitize(element.innerHTML) },
    };
  },
  parseHTML() { return [{ tag: 'div[data-plan-fixed]' }]; },
  renderHTML({ node }) {
    return fixedElement(node.attrs);
  },
  addNodeView() {
    return ({ node }) => ({
      dom: fixedElement(node.attrs),
      // Espaçamento visual das páginas não é uma edição do documento.
      ignoreMutation: mutation => mutation.type !== 'selection',
    });
  },
});

/** Cada pergunta existe uma vez; apenas sua resposta é editável. */
export const PlanField = Node.create({
  name: 'planField', group: 'block', content: 'block+', defining: true, isolating: true,
  addAttributes() {
    return {
      fieldId: { default: '', parseHTML: element => element.getAttribute('data-plan-field') },
      label: { default: '', parseHTML: element => element.querySelector('h3')?.textContent ?? '' },
      hint: { default: '', parseHTML: element => DOMPurify.sanitize(element.querySelector('[data-plan-hint]')?.innerHTML ?? '') },
      selectedOptions: { default: '', parseHTML: element => element.getAttribute('data-plan-selected') ?? '' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-plan-field]', contentElement: '[data-plan-content]' }]; },
  renderHTML({ node }) {
    const hint = document.createElement('div');
    hint.setAttribute('data-plan-hint', 'true'); hint.setAttribute('contenteditable', 'false');
    hint.innerHTML = DOMPurify.sanitize(String(node.attrs['hint']));
    const selected = String(node.attrs['selectedOptions']).split(',');
    for (const option of hint.querySelectorAll('[data-plan-option]')) {
      option.textContent = option.textContent?.replace(/^\([Xx\s]*\)/, selected.includes(option.getAttribute('data-plan-option')!) ? '(X)' : '( )') ?? '';
    }
    return ['div', { 'data-plan-field': node.attrs['fieldId'], 'data-plan-selected': node.attrs['selectedOptions'] },
      ['h3', { contenteditable: 'false' }, String(node.attrs['label'])],
      ...(node.attrs['hint'] ? [hint] : []),
      ['div', { 'data-plan-content': 'true' }, 0],
    ];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      let currentNode = node;
      const dom = document.createElement('div');
      const title = document.createElement('h3');
      title.setAttribute('contenteditable', 'false');
      const hint = document.createElement('div');
      hint.setAttribute('data-plan-hint', 'true');
      hint.setAttribute('contenteditable', 'false');
      const contentDOM = document.createElement('div');
      contentDOM.setAttribute('data-plan-content', 'true');
      dom.append(title, hint, contentDOM);

      const syncEditable = () => {
        for (const input of hint.querySelectorAll('input')) input.disabled = !editor.isEditable;
      };
      const render = () => {
        const focusedOption = hint.contains(document.activeElement) ? document.activeElement?.getAttribute('data-plan-checkbox') : null;
        dom.setAttribute('data-plan-field', String(currentNode.attrs['fieldId']));
        dom.setAttribute('data-plan-selected', String(currentNode.attrs['selectedOptions']));
        title.textContent = String(currentNode.attrs['label']);
        hint.innerHTML = DOMPurify.sanitize(String(currentNode.attrs['hint']));
        hint.hidden = !currentNode.attrs['hint'];
        const selected = String(currentNode.attrs['selectedOptions']).split(',').filter(Boolean);
        for (const option of hint.querySelectorAll('[data-plan-option]')) {
          const id = option.getAttribute('data-plan-option')!;
          const label = document.createElement('label');
          label.className = 'plan-support-option';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.setAttribute('data-plan-checkbox', id);
          input.checked = selected.includes(id);
          const text = document.createElement('span');
          text.textContent = option.textContent?.replace(/^\([Xx\s]*\)\s*/, '') ?? '';
          label.append(input, text);
          option.replaceChildren(label);
          input.addEventListener('change', () => {
            if (!editor.isEditable) { input.checked = selected.includes(id); return; }
            const pos = getPos();
            if (typeof pos !== 'number') return;
            const choices = new Set(String(currentNode.attrs['selectedOptions']).split(',').filter(Boolean));
            if (input.checked) choices.add(id); else choices.delete(id);
            editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...currentNode.attrs, selectedOptions: [...choices].join(',') }));
          });
        }
        syncEditable();
        if (focusedOption) hint.querySelector<HTMLInputElement>(`input[data-plan-checkbox="${focusedOption}"]`)?.focus({ preventScroll: true });
      };
      render();
      editor.on('update', syncEditable);
      editor.on('transaction', syncEditable);
      return {
        dom, contentDOM,
        update(updatedNode) {
          if (updatedNode.type !== currentNode.type) return false;
          const attrsChanged = Object.keys(updatedNode.attrs).some(key => updatedNode.attrs[key] !== currentNode.attrs[key]);
          currentNode = updatedNode;
          if (attrsChanged) render(); else syncEditable();
          return true;
        },
        stopEvent: event => hint.contains(event.target as globalThis.Node),
        ignoreMutation: mutation => mutation.type !== 'selection' && !contentDOM.contains(mutation.target),
        destroy() { editor.off('update', syncEditable); editor.off('transaction', syncEditable); },
      };
    };
  },
});
