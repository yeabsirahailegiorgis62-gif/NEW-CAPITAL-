# Capital Real Estate Fleet Management System
## Deliverable 10: University Guideline Alignment Matrix & Ingestion Template

---

### Status Notice: Awaiting University Guideline PDF
> [!IMPORTANT]
> **Document Status:** `AWAITING_GUIDELINE_PDF`
>
> In accordance with Section 15 (Deliverable 10) of the project audit instructions, this document provides the formal ingestion template and alignment schema to map your university's official internship documentation requirements against the verified **Capital Real Estate Fleet Management System** frontend codebase.
>
> No university formatting, chapter sequence, page count restrictions, or citation rules have been assumed or guessed. Once you provide the official university guideline PDF, this alignment matrix will be populated with exact section-by-section mappings.

---

### 1. Guideline Alignment Schema & Template Matrix

When your university's internship or capstone guideline document is provided, the table below will be completed to ensure 100% compliance:

| Guideline Requirement / Topic | Required Report Section / Chapter | Relevant Technical Evidence in Audit Suite | Current Documentation Status | Missing Information (To Be Provided by Student) | Next Action for Final Submission |
|:---|:---|:---|:---:|:---|:---|
| *E.g., Company Profile & Problem Statement* | Chapter 1: Introduction | [`01_FRONTEND_SYSTEM_OVERVIEW.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/01_FRONTEND_SYSTEM_OVERVIEW.md) (Sec 1) | **Ready** | University Department, Academic Advisor Name | Insert student metadata |
| *E.g., Technologies & Tools Review* | Chapter 2: Literature / Tools | [`01_FRONTEND_SYSTEM_OVERVIEW.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/01_FRONTEND_SYSTEM_OVERVIEW.md) (Sec 3) | **Ready** | Relevant theoretical citations if requested | Copy tech stack table |
| *E.g., Functional & Non-Functional Specs* | Chapter 3: Requirements Analysis | [`07_FRONTEND_PROJECT_REPORT_REFERENCE.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/07_FRONTEND_PROJECT_REPORT_REFERENCE.md) (Sec 3) | **Ready** | None (15 FRs & 8 NFRs verified) | Transfer requirements table |
| *E.g., Use Case Modeling & Textual Specs* | Chapter 3: System Modeling | [`07_FRONTEND_PROJECT_REPORT_REFERENCE.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/07_FRONTEND_PROJECT_REPORT_REFERENCE.md) (Sec 5) | **Ready** | None (4 major use cases detailed) | Render Mermaid diagrams |
| *E.g., Architectural Design & Directory Structure*| Chapter 4: System Architecture | [`02_FRONTEND_ARCHITECTURE_AND_CODEBASE.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/02_FRONTEND_ARCHITECTURE_AND_CODEBASE.md) (Sec 2) | **Ready** | None (Complete directory tree verified) | Embed architectural tree |
| *E.g., User Interface & Viewport Design* | Chapter 4: UI/UX & Design System | [`05_FRONTEND_UI_UX_AND_RESPONSIVENESS.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/05_FRONTEND_UI_UX_AND_RESPONSIVENESS.md) (Sec 2) | **Ready** | Real UI screenshots from running app | Capture suggested screenshots |
| *E.g., Implementation Walkthrough & Code* | Chapter 5: Implementation Details | [`03_FRONTEND_PAGES_AND_FEATURES.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/03_FRONTEND_PAGES_AND_FEATURES.md) (All) | **Ready** | Select specific code excerpts per chapter limit| Transfer feature descriptions |
| *E.g., API & Data Communication* | Chapter 5: Integration & Data Flow | [`04_FRONTEND_API_AND_DATA_FLOW.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/04_FRONTEND_API_AND_DATA_FLOW.md) (Sec 2) | **Ready** | None (All endpoints mapped) | Embed API integration table |
| *E.g., Testing Strategy & Results* | Chapter 6: Quality Assurance | [`06_FRONTEND_TESTING_AND_QUALITY_AUDIT.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/06_FRONTEND_TESTING_AND_QUALITY_AUDIT.md) (Sec 3) | **Ready** | None (23 test procedures recorded) | Transfer testing matrix |
| *E.g., Challenges, Future Work & Conclusion*| Chapter 7: Conclusion | [`07_FRONTEND_PROJECT_REPORT_REFERENCE.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/07_FRONTEND_PROJECT_REPORT_REFERENCE.md) (Sec 8, 9) | **Ready** | Personal reflection on internship experience | Adapt reflection text |

---

### 2. Standard University Report Verification Checklist

When reconciling the report against the university PDF guidelines, verify compliance with these standard academic criteria:

#### 2.1 Academic Formatting Compliance
* [ ] **Page Numbering Sequence:** Roman numerals (`i`, `ii`, `iii`) for preliminary pages (Abstract, Acknowledgments, Table of Contents, Lists of Figures/Tables); Arabic numerals (`1`, `2`, `3`...) starting from Chapter 1.
* [ ] **Typography & Margins:** Check whether the university mandates standard 1.5-inch left binding margin, 1.0-inch top/right/bottom margins, Times New Roman (12pt) or Arial (11pt), and 1.5 line spacing.
* [ ] **Heading Styles:** Verify exact hierarchy formatting (e.g., `1.1`, `1.1.1`) and title capitalization rules.
* [ ] **Citation Style:** Check whether the department specifies IEEE (numeric brackets `[1]`), APA (author-date), or Harvard referencing style.

#### 2.2 Content & Structure Verification
* [ ] **Certificate / Declaration Page:** Ensure standard university declaration of original work is included.
* [ ] **Company Evaluation / Sign-off Sheet:** Ensure inclusion of the industry supervisor's assessment form if mandated.
* [ ] **Lists of Tables & Figures:** Verify that every caption in the report matches the automated lists.
* [ ] **Appendices:** Verify inclusion of the master audit checklist ([`08_FRONTEND_AUDIT_CHECKLIST.md`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docs/frontend-audit/08_FRONTEND_AUDIT_CHECKLIST.md)) and sample code listings.

---

### 3. Protocol for Ingesting University Guideline PDF

To complete the alignment:
1. Provide the university's PDF guidelines (either by placing the file in the workspace or providing the text of the requirements).
2. The agent will inspect:
   * Mandatory chapter titles and sequence.
   * Specific required sections (e.g., feasibility study, methodology, UML diagrams).
   * Minimum and maximum page limits.
   * Prescribed diagram formats.
3. This file will then be updated to provide a 1-to-1 crosswalk mapping every university guideline directly to its verified source in `docs/frontend-audit/`.
