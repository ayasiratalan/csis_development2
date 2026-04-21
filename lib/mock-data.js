const { companies } = require("./company-config");

function isoDateOffset(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function paragraph(text) {
  return text.trim();
}

function buildMemo(company, intervalDays) {
  if (company.id === companies.chevron.id) {
    return [
      paragraph(
        company.name +
          " has had a dense " +
          intervalDays +
          "-day signal environment shaped by earnings messaging, portfolio updates, and policy-sensitive commentary around energy security, LNG, and emissions rules. Official filings and investor material point to a company positioning itself as disciplined on capital allocation while keeping optionality around global upstream and downstream volatility."
      ),
      paragraph(
        "Validated reporting and policy coverage indicate that the most relevant outreach angle for CSIS is not generic energy transition language, but the intersection of supply resilience, industrial competitiveness, and regulatory durability. That framing is more likely to resonate with Chevron's leadership than broad sustainability messaging because it aligns with investor-facing narratives already present in official channels."
      ),
      paragraph(
        "For a one-page memo, the strongest structure is: recent developments, regulatory and geopolitical exposure, and a short bridge to CSIS expertise in energy security, global supply chains, and strategic competition. The memo should emphasize how current policy shifts affect decision-making timelines rather than treating developments as isolated headlines."
      ),
      paragraph(
        "Recommended next step: position CSIS engagement as a targeted briefing or roundtable on energy market disruption, global policy risk, and investment planning. That creates a tighter fit with Chevron's immediate operating context and offers a credible reason to continue the conversation beyond a cold outreach note."
      )
    ].join("\n\n");
  }

  return [
    paragraph(
      company.name +
        " shows a similar " +
        intervalDays +
        "-day pattern of investor communication, litigation and regulatory watchpoints, and strategic framing around large-scale production, technology investment, and market resilience. The validated source set suggests a leadership team focused on execution credibility, long-cycle returns, and exposure to changing federal and international policy conditions."
    ),
    paragraph(
      "The best CSIS angle is to connect ExxonMobil's current public positioning with broader questions about industrial strategy, energy security, and the geopolitical consequences of supply realignment. That is more useful than a generic corporate profile because it ties directly to the operating logic visible in the validated documents."
    ),
    paragraph(
      "A concise memo should surface the most material developments, explain which policy or market pressures are shaping them, and translate that into why CSIS expertise matters now. In practice, that means highlighting where external regulation, procurement, or security debates may influence board-level and external-affairs priorities."
    ),
    paragraph(
      "Recommended next step: frame outreach around a focused discussion with CSIS experts on strategic energy competition, federal policy pathways, and the downstream implications for corporate planning. That approach keeps the invitation substantive and tied to current decisions rather than appearing purely promotional."
    )
  ].join("\n\n");
}

function buildSources(company, intervalDays) {
  const baseSources = {
    chevron: [
      {
        title: "Chevron investor relations update",
        url: "https://www.chevron.com/investors",
        domain: "chevron.com",
        sourceClass: "official",
        publishedDate: isoDateOffset(Math.min(intervalDays - 2, 7))
      },
      {
        title: "Recent SEC filing for Chevron Corporation",
        url: "https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/93410/latest-filing.htm",
        domain: "sec.gov",
        sourceClass: "official",
        publishedDate: isoDateOffset(Math.min(intervalDays - 3, 10))
      },
      {
        title: "Federal Register energy policy notice mentioning upstream activity",
        url: "https://www.federalregister.gov/documents/sample-chevron-energy-policy",
        domain: "federalregister.gov",
        sourceClass: "government",
        publishedDate: isoDateOffset(Math.min(intervalDays - 5, 12))
      },
      {
        title: "CSIS analysis on energy security and market resilience",
        url: "https://www.csis.org/analysis/sample-energy-security-briefing",
        domain: "csis.org",
        sourceClass: "thinktank",
        publishedDate: isoDateOffset(Math.min(intervalDays - 6, 14))
      },
      {
        title: "Major press coverage of Chevron market positioning",
        url: "https://www.reuters.com/world/us/sample-chevron-market-story",
        domain: "reuters.com",
        sourceClass: "news",
        publishedDate: isoDateOffset(Math.min(intervalDays - 1, 5))
      }
    ],
    exxon: [
      {
        title: "ExxonMobil corporate update",
        url: "https://corporate.exxonmobil.com/news",
        domain: "corporate.exxonmobil.com",
        sourceClass: "official",
        publishedDate: isoDateOffset(Math.min(intervalDays - 2, 6))
      },
      {
        title: "Recent SEC filing for Exxon Mobil Corporation",
        url: "https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/34088/latest-filing.htm",
        domain: "sec.gov",
        sourceClass: "official",
        publishedDate: isoDateOffset(Math.min(intervalDays - 4, 11))
      },
      {
        title: "OpenSecrets profile related to recent lobbying activity",
        url: "https://www.opensecrets.org/sample/exxon-policy-tracker",
        domain: "opensecrets.org",
        sourceClass: "government",
        publishedDate: isoDateOffset(Math.min(intervalDays - 6, 15))
      },
      {
        title: "Brookings commentary on energy industrial strategy",
        url: "https://www.brookings.edu/articles/sample-energy-industrial-strategy",
        domain: "brookings.edu",
        sourceClass: "thinktank",
        publishedDate: isoDateOffset(Math.min(intervalDays - 8, 18))
      },
      {
        title: "Major press coverage of ExxonMobil operations and policy exposure",
        url: "https://www.wsj.com/articles/sample-exxon-policy-story",
        domain: "wsj.com",
        sourceClass: "news",
        publishedDate: isoDateOffset(Math.min(intervalDays - 3, 9))
      }
    ]
  };

  return baseSources[company.id].map((source, index) => ({
    id: company.id + "-src-" + (index + 1),
    validationStatus: "accepted",
    entityConfidence: 0.83 + index * 0.03,
    ...source
  }));
}

function buildMockReport(company, intervalDays) {
  const generatedAt = new Date().toISOString();
  const runId =
    company.id + "_" + generatedAt.slice(0, 10) + "_" + intervalDays + "d_mock";

  return new Promise((resolve) => {
    const delayMs = Number(process.env.MOCK_DELAY_MS || 900);

    setTimeout(() => {
      resolve({
        ok: true,
        mode: "mock",
        runId,
        generatedAt,
        company: company.name,
        intervalDays,
        memo: buildMemo(company, intervalDays),
        sources: buildSources(company, intervalDays),
        excelFileName:
          company.name + "_validated_documents_" + generatedAt.slice(0, 10) + ".xlsx"
      });
    }, delayMs);
  });
}

module.exports = {
  buildMockReport
};
