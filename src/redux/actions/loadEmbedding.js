import { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR } from '../actionTypes/embeddings';
import { fetchCachedWork } from '../../utils/cacheRequest';

const TIMEOUT_SECONDS = 50;

const loadEmbedding = (experimentId, embeddingType) => async (dispatch, getState) => {
  // If a previous load was initiated, hold off on it until that one is executed.
  if (getState().embeddings[embeddingType] && getState().embeddings[embeddingType].loading) {
    return null;
  }

  // Do not allow loading when we are no longer in a loading state if there is no error condition.
  if (getState().embeddings[embeddingType] && !getState().embeddings[embeddingType].error) {
    return null;
  }

  // Set up loading state.
  await dispatch({
    type: EMBEDDINGS_LOADING,
    payload: {
      experimentId,
      embeddingType,
    },
  });

  // TODO: this `embeddingType` will be changed to an embedding ID created during pre-processing.
  const body = {
    name: 'GetEmbedding',
    type: embeddingType,
  };

  try {
    const data = await fetchCachedWork(experimentId, TIMEOUT_SECONDS, body, 3600, 1);
    return dispatch({
      type: EMBEDDINGS_LOADED,
      payload: {
        experimentId,
        embeddingType,
        data,
      },
    });
  } catch (e) {
    return dispatch({
      type: EMBEDDINGS_ERROR,
      payload: {
        experimentId,
        embeddingType,
        error: "Oops, we couldn't load your embedding. The computation took too long or your connection is broken.",
      },
    });
  }
};

export default loadEmbedding;
