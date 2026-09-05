import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { GuideSearch } from '../components/GuideSearch'

export function HomePage() {
  return (
    <>
      <div className="mast">
        <BrandMark size={44} className="hero__mark" />
        <p className="mast__tag">È questo il momento giusto per comprarlo?</p>
      </div>

      <GuideSearch />

      <section className="section section--tight" id="come-funziona">
        <div className="section__head">
          <h2>Poi decidi se conviene</h2>
          <p>
            Tu dici di cosa hai bisogno. Cercatrova trova il pezzo e ti dice se è il momento di
            comprarlo — non un listino di offerte random.
          </p>
        </div>
        <div className="steps steps--3">
          <article className="step">
            <div className="step__n">01</div>
            <h3>Scegli</h3>
            <p>Categoria, marca, tipo, quantità. Come al banco: “RAM? DDR5? 32 giga?”</p>
          </article>
          <article className="step">
            <div className="step__n">02</div>
            <h3>Trova</h3>
            <p>
              Se conviene adesso, te lo mostro. Se no, vedi i prodotti lo stesso — e ti avviso
              quando sarà il momento.
            </p>
          </article>
          <article className="step">
            <div className="step__n">03</div>
            <h3>Monitora</h3>
            <p>
              Alert Telegram quando scende al tuo prezzo o diventa eccezionale.{' '}
              <Link to="/cerca">Imposta il monitoraggio</Link>.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}
