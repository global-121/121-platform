import { of } from 'rxjs/internal/observable/of';
import { PersonalComponents } from '../personal-components/personal-components.enum';
import {
  ConversationActions,
  ConversationSection,
} from '../services/conversation.service';

const mockConversationSection: ConversationSection = {
  name: PersonalComponents.selectLanguage,
};

export const MockConversationService = {
  state: {
    isLoading: false,
  },
  updateConversation$: of(),
  conversationActions: ConversationActions,
  shouldScroll$: of(),
  getConversationUpToNow: () => Promise.resolve([mockConversationSection]),
  startLoading: () => {},
  stopLoading: () => {},
  scrollToEnd: () => {},
  scrollToLastSection: () => {},
  onSectionCompleted: () => {},
  restoreAfterLogin: () => {},
};
