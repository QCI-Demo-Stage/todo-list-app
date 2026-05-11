'use strict';

/**
 * End-to-end CRUD: the UI performs actions; `cy.request` asserts the REST API
 * (and therefore the backing database). Set `DATABASE_URL` to a PostgreSQL
 * connection string when starting the stack so persistence is verified against
 * Postgres; otherwise the E2E npm script uses SQLite (`SQLITE_PATH`).
 */

function apiUrl(path) {
  const base = (Cypress.env('apiBaseUrl') || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function unwrapData(body) {
  expect(body).to.be.an('object');
  expect(body).to.have.property('success', true);
  return body.data;
}

function resetTasksViaApi() {
  return cy.request('GET', apiUrl('/api/tasks')).then((res) => {
    expect(res.status).to.eq(200);
    const tasks = unwrapData(res.body);
    cy.wrap(tasks).each((task) => {
      cy.request('DELETE', apiUrl(`/api/tasks/${task.id}`)).its('status').should('eq', 200);
    });
  });
}

function seedTaskViaApi(title, completed = false) {
  return cy
    .request({
      method: 'POST',
      url: apiUrl('/api/tasks'),
      body: { title, completed },
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return unwrapData(res.body);
    });
}

describe('Todo CRUD (UI + API)', () => {
  beforeEach(() => {
    resetTasksViaApi();
  });

  it('creates a task in the UI and persists it (readable via API)', () => {
    const title = `E2E create ${Date.now()}`;

    cy.visit('/');
    cy.get('#new-task-title').clear().type(title);
    cy.contains('button', 'Add').click();

    cy.get('.task-list').should('exist');
    cy.contains('.task-row', title).should('be.visible');

    cy.request('GET', apiUrl('/api/tasks')).then((res) => {
      expect(res.status).to.eq(200);
      const tasks = unwrapData(res.body);
      expect(tasks.some((t) => t.title === title)).to.eq(true);
    });
  });

  it('reads tasks from the API in the UI', () => {
    const title = `E2E read ${Date.now()}`;
    seedTaskViaApi(title, false);

    cy.visit('/');
    cy.get('.task-list').should('exist');
    cy.contains('.task-row', title).should('be.visible');

    cy.request('GET', apiUrl('/api/tasks')).then((res) => {
      const tasks = unwrapData(res.body);
      const match = tasks.find((t) => t.title === title);
      expect(match).to.exist;
      expect(match.completed).to.eq(false);
    });
  });

  it('updates a task in the UI and reflects changes via API', () => {
    const original = `E2E update orig ${Date.now()}`;
    const updated = `E2E update new ${Date.now()}`;

    seedTaskViaApi(original, false).then((created) => {
      cy.visit('/');
      cy.contains('.task-row', original).within(() => {
        cy.contains('button', 'Edit').click();
      });

      cy.get(`#edit-title-${created.id}`).clear().type(updated);
      cy.contains('label.checkbox-label', 'Completed').find('input[type="checkbox"]').check();
      cy.contains('.modal button[type="submit"]', 'Save').click();

      cy.contains('.task-row', updated).should('be.visible');
      cy.contains('.task-row', original).should('not.exist');

      cy.request('GET', apiUrl(`/api/tasks/${created.id}`)).then((res) => {
        expect(res.status).to.eq(200);
        const task = unwrapData(res.body);
        expect(task.title).to.eq(updated);
        expect(task.completed).to.eq(true);
      });
    });
  });

  it('deletes a task in the UI and removes it from the API', () => {
    const title = `E2E delete ${Date.now()}`;

    seedTaskViaApi(title, false).then((created) => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win, 'confirm').returns(true);
        },
      });

      cy.contains('.task-row', title).within(() => {
        cy.contains('button', 'Delete').click();
      });

      cy.contains('.tasks-status', 'No tasks yet').should('be.visible');

      cy.request({ url: apiUrl(`/api/tasks/${created.id}`), failOnStatusCode: false }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });
});
