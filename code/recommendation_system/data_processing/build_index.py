import faiss
import numpy as np

def build_and_save_index(embedding_file, index_file):
    """
    Loads embeddings, NORMALIZES them, builds a FAISS IndexFlatIP index,
    and saves the index to disk.
    """
    try:
        # Load the embeddings from the .npy file
        print(f"Loading embeddings from '{embedding_file}'...")
        embeddings = np.load(embedding_file).astype('float32')
        print(f"Embeddings loaded. Shape: {embeddings.shape}")

        # --- FIX 1: NORMALIZE THE EMBEDDINGS ---
        # This crucial step scales all vectors to a unit length of 1.
        print("Normalizing embeddings to unit length...")
        faiss.normalize_L2(embeddings)

        embedding_dimension = embeddings.shape[1]

        # --- FIX 2: USE IndexFlatIP FOR COSINE SIMILARITY ---
        # IndexFlatIP (Inner Product) is the correct index for comparing normalized text vectors.
        print(f"Building FAISS IndexFlatIP with dimension {embedding_dimension}...")
        index = faiss.IndexFlatIP(embedding_dimension)

        # Add the normalized embeddings to the index
        index.add(embeddings)
        print(f"Successfully added {index.ntotal} vectors to the index.")

        # Save the Index
        print(f"Saving index to '{index_file}'...")
        faiss.write_index(index, index_file)
        print(f"Index saved successfully!")

    except FileNotFoundError:
        print(f"ERROR: The file '{embedding_file}' was not found.")
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")

if __name__ == '__main__':
    embedding_filename = 'location_embeddings.npy'
    index_filename = 'location_index.faiss'

    build_and_save_index(embedding_filename, index_filename)