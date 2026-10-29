import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/** A failing page must not blank the whole installed application or erase local records. */
export default class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('SSC page render error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="ssc-recovery" role="alert">
      <AlertTriangle size={28} aria-hidden="true"/>
      <h2>Could not display this page</h2>
      <p>Your saved inspection records have not been deleted. Try reopening this page. If the problem persists, return to Harmonix and export a backup from Settings.</p>
      <div className="ssc-recovery-actions">
        <button type="button" onClick={() => this.setState({ error: null })}><RotateCcw size={16}/> Retry page</button>
        <button type="button" onClick={() => { this.setState({ error:null }); this.props.onHome?.(); }}><Home size={16}/> Harmonix home</button>
      </div>
    </main>;
  }
}
