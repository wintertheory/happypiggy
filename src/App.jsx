import mailboxImage from './assets/mailbox.png';
import React, { useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { validateHappinessNote } from './lib/contentFilter';

const COOLDOWN_MS = 900;

function Mailbox({ mode }) {
  const className = useMemo(() => {
    return ['mailbox-wrap', mode ? `is-${mode}` : ''].filter(Boolean).join(' ');
  }, [mode]);

  return (
    <div className={className} aria-hidden="true">
      <img className="mailbox-image" src={mailboxImage} alt="" />
      <div className="animated-note" />
    </div>
  );
}

function Modal({ children, onClose, ariaLabel }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="memo-modal" role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
        {children}
        <div className="memo-corner" aria-hidden="true" />
      </section>
    </div>
  );
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultNote, setResultNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [mode, setMode] = useState('idle');
  const [isBusy, setIsBusy] = useState(false);

  const isDisabled = isBusy || mode === 'depositing' || mode === 'withdrawing';
  const remainingChars = 60 - inputValue.length;

  function closeDepositModal() {
    if (isDisabled) return;
    setIsDepositOpen(false);
    setFeedback('');
  }

  function closeResultModal() {
    setIsResultOpen(false);
    setResultNote('');
  }

  function runAnimation(nextMode, callback) {
    setMode(nextMode);
    window.setTimeout(() => {
      setMode('idle');
      callback?.();
    }, COOLDOWN_MS);
  }

  async function handleDepositSubmit(event) {
    event.preventDefault();

    const validation = validateHappinessNote(inputValue);
    if (!validation.ok) {
      setFeedback(validation.message);
      return;
    }

    try {
      setIsBusy(true);
      setFeedback('');

      const { error } = await supabase
        .from('happiness_notes')
        .insert({ content: validation.content });

      if (error) throw error;

      setInputValue('');
      setIsDepositOpen(false);

      runAnimation('depositing', () => {
        setIsBusy(false);
      });
    } catch (error) {
      console.error(error);
      setFeedback('저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
      setIsBusy(false);
    }
  }

  async function handleDraw() {
    if (isDisabled) return;

    try {
      setIsBusy(true);
      setFeedback('');
      setResultNote('');

      const { data, error } = await supabase.rpc('get_random_happiness_note');
      if (error) throw error;

      const selectedNote = Array.isArray(data) && data.length > 0
        ? data[0]?.content
        : '아직 저금된 행복이 없어요.';

      if (selectedNote === '아직 저금된 행복이 없어요.') {
        setResultNote(selectedNote);
        setIsResultOpen(true);
        setIsBusy(false);
        return;
      }

      runAnimation('withdrawing', () => {
        setResultNote(selectedNote);
        setIsResultOpen(true);
        setIsBusy(false);
      });
    } catch (error) {
      console.error(error);
      setResultNote('뽑기 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
      setIsResultOpen(true);
      setIsBusy(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="happy-bank" aria-label="행복 저금통">
        <h1>행복 저금통</h1>

        <Mailbox mode={mode} />

        <div className="button-row">
          <button
            className="button button-primary"
            type="button"
            onClick={() => setIsDepositOpen(true)}
            disabled={isDisabled}
          >
            저금
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleDraw}
            disabled={isDisabled}
          >
            뽑기
          </button>
        </div>
      </section>

      {isDepositOpen && (
        <Modal onClose={closeDepositModal} ariaLabel="행복 기록 저금하기">
          <form className="memo-form" onSubmit={handleDepositSubmit}>
            <h2>기록</h2>
            <textarea
              value={inputValue}
              maxLength={60}
              onChange={(event) => {
                setInputValue(event.target.value);
                setFeedback('');
              }}
              placeholder="오늘 들은 노래가 좋았다"
              autoFocus
            />
            <div className="memo-meta">
              <span aria-live="polite">{feedback}</span>
              <span>{remainingChars}</span>
            </div>
            <button className="button button-primary memo-submit" type="submit" disabled={isDisabled}>
              저금하자!!
            </button>
          </form>
        </Modal>
      )}

      {isResultOpen && (
        <Modal onClose={closeResultModal} ariaLabel="뽑은 행복 기록">
          <div className="result-box">
            <h2>행복을 돌이켜보자</h2>
            <p>{resultNote}</p>
            <button className="button button-secondary result-close" type="button" onClick={closeResultModal}>
              닫기
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
