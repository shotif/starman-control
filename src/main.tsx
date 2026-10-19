import { render } from 'preact';
import { Title } from './ui/Title.tsx';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) render(<Title buildId={__BUILD_ID__} />, app);
