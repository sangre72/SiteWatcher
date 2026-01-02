// atom.ts
import { atom } from 'recoil';

export const gptDataState = atom<string>({
    key: 'gptDataState',
    default: '',
});

export const gptDataTitleState = atom<string>({
    key: 'gptDataTitleState',
    default: '',
});
