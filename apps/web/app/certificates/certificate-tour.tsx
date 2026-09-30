import Link from 'next/link';

export default function CertificateTour() {
  return <section className="certificate-tour" aria-labelledby="certificate-tour-title">
    <div className="ct-hero">
      <div className="ct-intro">
        <p className="eyebrow">Your learning, recognised</p>
        <h1 id="certificate-tour-title">Certificate tour</h1>
        <p className="ct-lead">See what you’ll earn. Understand what it means.</p>
        <p>Explore your Transligual certificate before you start learning, from the course you complete to the code that verifies your achievement.</p>
        <div className="ct-actions"><Link className="button" href="/courses">Explore courses <span aria-hidden="true">→</span></Link><a className="text-link" href="#earned-certificates">My certificates <span aria-hidden="true">↗</span></a></div>
        <div className="ct-tags"><span>Personalised PDF</span><span>Course completion</span><span>Public verification</span></div>
      </div>
      <figure className="ct-preview">
        <div className="ct-paper">
          <div className="ct-paper-top"><strong>TRANSLIGUAL</strong><span>Sample preview</span></div>
          <div className="ct-paper-body"><span className="ct-seal" aria-hidden="true">T</span><p className="ct-kicker">Certificate of</p><h2>Completion</h2><p>This certifies that</p><p className="ct-name">Your name</p><p>has completed the required lessons and assessments for</p><p className="ct-course">Your course title</p></div>
          <div className="ct-paper-bottom"><div><span>Issue date</span><strong>Upon completion</strong></div><div><span>Certificate number</span><strong>Assigned when issued</strong></div></div>
          <p className="ct-code">Unique verification code · Issued by Transligual</p>
        </div>
        <figcaption>Illustrative preview. Your issued PDF includes your name, course, issue date and unique verification details.</figcaption>
      </figure>
    </div>
    <div className="ct-type"><div><p className="eyebrow">Know your certificate</p><h2>Certificate of completion</h2></div><div><p>This is the certificate currently awarded by Transligual. It records completion of a certificate-enabled course and its required assessments.</p><p className="ct-muted">The course title identifies what you studied. It is a Transligual course achievement, not a diploma or an external language-proficiency qualification.</p></div></div>
    <section className="ct-details" aria-labelledby="ct-details-title"><div className="ct-section-heading"><p className="eyebrow">A closer look</p><h2 id="ct-details-title">What your certificate tells you</h2></div><div className="ct-detail-grid">
      <article><span className="ct-number">01</span><h3>Your name &amp; course</h3><p>Identifies the learner and the exact course completed. Each eligible course earns its own certificate.</p></article>
      <article><span className="ct-number">02</span><h3>Your achievement</h3><p>Confirms you completed the course requirements and passed its published assessments.</p></article>
      <article><span className="ct-number">03</span><h3>Your verification code</h3><p>A unique code lets others check the course, issue date and current certificate status.</p></article>
    </div></section>
    <section className="ct-journey" aria-labelledby="ct-journey-title"><h2 id="ct-journey-title">From your first lesson to your certificate</h2><ol><li><strong>Choose your course</strong><span>Check that it offers a certificate.</span></li><li><strong>Complete &amp; pass</strong><span>Finish the lessons and pass the required assessments.</span></li><li><strong>Download &amp; share</strong><span>Find your issued PDF below and share its verification link.</span></li></ol></section>
    <div className="ct-verify"><div><h3>Already have a certificate code?</h3><p>Check a certificate’s authenticity and current status.</p></div><Link className="button-outline" href="/certificates/verify">Verify a certificate <span aria-hidden="true">→</span></Link></div>
  </section>;
}
