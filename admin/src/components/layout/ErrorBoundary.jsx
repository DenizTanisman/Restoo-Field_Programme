import { Component } from "react";

// Tüm sayfa render'larını saran ErrorBoundary.
// Bir component throw ederse browser tab'ı çökmek yerine
// sayfa içi anlamlı bir hata UI'ı görünür. STATUS_BREAKPOINT gibi
// kullanıcıyı şaşırtan crash'leri engeller.
export default class ErrorBoundary extends Component {
  state = { error: null, info: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="card bg-base-100 shadow-sm max-w-3xl mx-auto my-8">
        <div className="card-body">
          <h2 className="card-title text-error">Bir şey ters gitti</h2>
          <p className="text-sm opacity-80">
            Sayfa render edilirken bir hata oluştu. Hatanın detayını aşağıda görebilirsin.
            Tarayıcı sekmesini çökertmek yerine bu mesajı gösteriyoruz.
          </p>
          <div className="bg-base-200 rounded p-3 mt-2 text-xs font-mono whitespace-pre-wrap break-words">
            {String(error?.stack || error?.message || error)}
          </div>
          {info?.componentStack && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-70">Component stack</summary>
              <div className="bg-base-200 rounded p-3 mt-1 text-xs font-mono whitespace-pre-wrap break-words">
                {info.componentStack}
              </div>
            </details>
          )}
          <div className="modal-action mt-2">
            <button className="btn btn-sm btn-ghost" onClick={() => window.location.reload()}>
              Sayfayı yenile
            </button>
            <button className="btn btn-sm btn-primary" onClick={this.reset}>
              Tekrar dene
            </button>
          </div>
        </div>
      </div>
    );
  }
}
