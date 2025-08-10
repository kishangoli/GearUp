import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import ReactDOM from 'react-dom/client';

import './index.css'
import {MinisContainer} from '@shopify/shop-minis-react'

import {App} from './App'
import { UserAnswersProvider } from './context/UserAnswersContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinisContainer>
      <UserAnswersProvider>
        <App />
      </UserAnswersProvider>
    </MinisContainer>
  </StrictMode>
)



